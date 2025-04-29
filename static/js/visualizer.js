/**
 * Database Visualizer - Handles visualization of database relationships using D3.js
 */
class DatabaseVisualizer {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.svg = null;
        this.simulation = null;
        this.data = null;
        this.detailContent = document.getElementById('detail-content');
        
        // Initialize the visualization
        this.initialize();
        
        // Handle window resize events
        window.addEventListener('resize', () => {
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            if (this.data) {
                this.renderDiagram(this.data);
            }
        });
    }
    
    /**
     * Initialize the SVG container
     */
    initialize() {
        // Clear any existing SVG
        if (this.svg) {
            this.svg.remove();
        }
        
        // Create SVG container
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'database-diagram');
            
        // Add a defs element for arrow markers
        const defs = this.svg.append('defs');
        
        // Define arrow markers for different relationship types
        this.defineMarkers(defs);
    }
    
    /**
     * Define arrow markers for different relationship types
     */
    defineMarkers(defs) {
        // Standard arrow marker
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#95a5a6');
            
        // One-to-one relationship marker
        defs.append('marker')
            .attr('id', 'one-to-one')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#3498db');
            
        // One-to-many relationship marker
        defs.append('marker')
            .attr('id', 'one-to-many')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#e67e22');
            
        // Many-to-many relationship marker
        defs.append('marker')
            .attr('id', 'many-to-many')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#9b59b6');
    }
    
    /**
     * Process database schema data for visualization
     */
    processData(data) {
        // Store the raw data
        this.data = data;
        
        // Process tables into nodes
        const nodes = data.tables.map(table => {
            return {
                id: table.name,
                label: table.name,
                type: 'table',
                columns: table.columns,
                primary_keys: table.primary_keys,
                unique_constraints: table.unique_constraints
            };
        });
        
        // Process relationships into links
        const links = data.relationships.map((rel, index) => {
            return {
                id: `link-${index}`,
                source: rel.source_table,
                target: rel.target_table,
                sourceColumns: rel.source_columns,
                targetColumns: rel.target_columns,
                type: rel.type,
                name: rel.name
            };
        });
        
        return { nodes, links };
    }
    
    /**
     * Render the database diagram
     */
    renderDiagram(data) {
        // Process the data
        const { nodes, links } = this.processData(data);
        
        // Clear existing visualization
        this.initialize();
        
        // Create a zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });
            
        // Enable zoom on the SVG
        this.svg.call(zoom);
        
        // Create a container for the visualization elements
        const container = this.svg.append('g');
        
        // Create a force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(200))
            .force('charge', d3.forceManyBody().strength(-1000))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(100));
            
        // Create links
        const link = container.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('class', d => `link ${this.getRelationshipClass(d.type)}`)
            .attr('id', d => `link-${d.id}`)
            .attr('marker-end', d => `url(#${this.getRelationshipMarker(d.type)})`)
            .on('click', (event, d) => this.showRelationshipDetails(d));
            
        // Create nodes
        const node = container.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this)));
                
        // Create table rectangles
        node.append('rect')
            .attr('width', 160)
            .attr('height', d => 30 + d.columns.length * 22)
            .attr('rx', 5)
            .attr('ry', 5);
            
        // Create table name text
        node.append('text')
            .attr('x', 80)
            .attr('y', 20)
            .attr('class', 'table-name')
            .text(d => d.label);
            
        // Create horizontal line separator
        node.append('line')
            .attr('x1', 0)
            .attr('y1', 30)
            .attr('x2', 160)
            .attr('y2', 30)
            .attr('stroke', '#3498db')
            .attr('stroke-width', 1);
            
        // Create column groups
        const columnGroups = node.selectAll('.column')
            .data(d => d.columns.map(column => ({
                name: column.name,
                type: column.type,
                nullable: column.nullable,
                primary_key: column.primary_key,
                table: d.label,
                foreign_key: this.isColumnForeignKey(links, d.label, column.name)
            })))
            .enter()
            .append('g')
            .attr('class', 'column')
            .attr('transform', (d, i) => `translate(5, ${40 + i * 22})`);
            
        // Create column background
        columnGroups.append('rect')
            .attr('width', 150)
            .attr('height', 20)
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('class', d => {
                if (d.primary_key) return 'pk';
                if (d.foreign_key) return 'fk';
                return '';
            })
            .attr('fill', d => {
                if (d.primary_key) return '#d6eaf8';
                if (d.foreign_key) return '#fef9e7';
                return 'transparent';
            });
            
        // Create column name text
        columnGroups.append('text')
            .attr('x', 5)
            .attr('y', 15)
            .attr('class', 'column-name')
            .text(d => {
                let prefix = '';
                if (d.primary_key) prefix = '🔑 ';
                else if (d.foreign_key) prefix = '🔗 ';
                return `${prefix}${d.name}`;
            });
            
        // Create column type text
        columnGroups.append('text')
            .attr('x', 145)
            .attr('y', 15)
            .attr('text-anchor', 'end')
            .attr('class', 'column-type')
            .text(d => this.formatColumnType(d.type));
            
        // Update positions on each tick of the simulation
        this.simulation.on('tick', () => {
            link.attr('d', d => {
                const sourceNode = nodes.find(n => n.id === d.source.id);
                const targetNode = nodes.find(n => n.id === d.target.id);
                
                if (!sourceNode || !targetNode) return '';
                
                // Calculate the total height of each node based on column count
                const sourceHeight = 30 + sourceNode.columns.length * 22;
                const targetHeight = 30 + targetNode.columns.length * 22;
                
                // Calculate source and target points
                const sourceX = sourceNode.x + 80; // middle of the node
                const sourceY = sourceNode.y + sourceHeight / 2;
                const targetX = targetNode.x + 80; // middle of the node
                const targetY = targetNode.y + targetHeight / 2;
                
                // Calculate control points for curved path
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const dr = Math.sqrt(dx * dx + dy * dy);
                
                return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
            });
            
            node.attr('transform', d => `translate(${d.x - 80},${d.y - 15})`);
        });
    }
    
    /**
     * Format column type for display
     */
    formatColumnType(type) {
        // Extract the core type name (e.g., VARCHAR(255) -> VARCHAR)
        const match = type.match(/^([A-Za-z]+)/);
        if (match) {
            return match[1].toLowerCase();
        }
        return type.toLowerCase();
    }
    
    /**
     * Check if a column is a foreign key
     */
    isColumnForeignKey(links, tableName, columnName) {
        return links.some(link => 
            link.source === tableName && 
            link.sourceColumns.includes(columnName)
        );
    }
    
    /**
     * Get CSS class for relationship type
     */
    getRelationshipClass(type) {
        switch (type) {
            case '1:1': return 'one-to-one';
            case '1:M': return 'one-to-many';
            case 'M:1': return 'many-to-one';
            case 'M:M': return 'many-to-many';
            default: return '';
        }
    }
    
    /**
     * Get marker type for relationship
     */
    getRelationshipMarker(type) {
        switch (type) {
            case '1:1': return 'one-to-one';
            case '1:M': return 'one-to-many';
            case 'M:1': return 'one-to-many';
            case 'M:M': return 'many-to-many';
            default: return 'arrow';
        }
    }
    
    /**
     * Show relationship details
     */
    showRelationshipDetails(relationship) {
        const detailEl = this.detailContent;
        
        // Clear previous content
        detailEl.innerHTML = '';
        
        // Create relationship detail container
        const detail = document.createElement('div');
        detail.className = 'relationship-detail';
        
        // Create relationship title
        const title = document.createElement('h4');
        title.textContent = `${relationship.source} → ${relationship.target} (${relationship.type})`;
        detail.appendChild(title);
        
        // Create relationship description
        const description = document.createElement('p');
        let relDescription = '';
        
        switch (relationship.type) {
            case '1:1':
                relDescription = 'One-to-One: Each record in the first table corresponds to exactly one record in the second table.';
                break;
            case '1:M':
                relDescription = 'One-to-Many: Each record in the first table corresponds to one or more records in the second table.';
                break;
            case 'M:1':
                relDescription = 'Many-to-One: Multiple records in the first table correspond to one record in the second table.';
                break;
            case 'M:M':
                relDescription = 'Many-to-Many: Multiple records in the first table correspond to multiple records in the second table.';
                break;
            default:
                relDescription = 'Relationship type unknown.';
        }
        
        description.textContent = relDescription;
        detail.appendChild(description);
        
        // Create columns mapping
        const columnsMap = document.createElement('div');
        columnsMap.className = 'columns-map';
        
        const sourceColumns = relationship.sourceColumns.join(', ');
        const targetColumns = relationship.targetColumns.join(', ');
        
        columnsMap.innerHTML = `
            <p><strong>Source Columns:</strong> ${sourceColumns}</p>
            <p><strong>Target Columns:</strong> ${targetColumns}</p>
        `;
        
        detail.appendChild(columnsMap);
        
        // Add to the container
        detailEl.appendChild(detail);
        
        // Highlight the selected relationship
        this.highlightRelationship(relationship.id);
    }
    
    /**
     * Highlight the selected relationship
     */
    highlightRelationship(id) {
        // Remove highlight from all links
        d3.selectAll('.link').classed('highlighted', false);
        
        // Add highlight to selected link
        d3.select(`#link-${id}`).classed('highlighted', true);
    }
    
    /**
     * Handle drag start event
     */
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    /**
     * Handle drag event
     */
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    /**
     * Handle drag end event
     */
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}