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
        
        // Create the relationship legend
        this.createLegend();
    }
    
    /**
     * Create a legend explaining the relationship line styles
     */
    createLegend() {
        // Remove any existing legend
        let existingLegend = document.querySelector('.relationship-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
        
        // Create legend container
        const legend = document.createElement('div');
        legend.className = 'relationship-legend';
        
        // Add legend title
        const title = document.createElement('div');
        title.className = 'legend-title';
        title.textContent = 'Relationship Types';
        legend.appendChild(title);
        
        // Define legend items
        const legendItems = [
            { type: 'one-to-one', text: 'One-to-One (1:1)', style: 'dashed' },
            { type: 'one-to-many', text: 'One-to-Many (1:M)', style: 'solid' },
            { type: 'many-to-many', text: 'Many-to-Many (M:M)', style: 'solid' }
        ];
        
        // Create legend items
        legendItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'legend-item';
            
            const line = document.createElement('div');
            line.className = `legend-line ${item.type}`;
            
            const text = document.createElement('div');
            text.className = 'legend-text';
            text.textContent = item.text;
            
            itemDiv.appendChild(line);
            itemDiv.appendChild(text);
            legend.appendChild(itemDiv);
        });
        
        // Add legend to container
        this.container.appendChild(legend);
    }
    
    /**
     * Define arrow markers for different relationship types
     */
    defineMarkers(defs) {
        // Standard arrow marker
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
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
            .attr('refX', 20)
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
            .attr('refX', 20)
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
            .attr('refX', 20)
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
        console.log("Processing data:", data);
        
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
        
        console.log("Nodes created:", nodes.length);
        
        // Process relationships into links
        const links = [];
        
        // Make sure relationships exist and it's an array
        if (data.relationships && Array.isArray(data.relationships)) {
            data.relationships.forEach((rel, index) => {
                // Only create links for valid relationships
                if (rel.source_table && rel.target_table) {
                    // Check if the source and target tables exist
                    const sourceExists = nodes.some(n => n.id === rel.source_table);
                    const targetExists = nodes.some(n => n.id === rel.target_table);
                    
                    if (sourceExists && targetExists) {
                        links.push({
                            id: index,
                            source: rel.source_table,
                            target: rel.target_table,
                            sourceColumns: rel.source_columns || [],
                            targetColumns: rel.target_columns || [],
                            type: rel.type || 'unknown',
                            name: rel.name || `Link ${index}`
                        });
                    } else {
                        console.warn(`Skipping relationship: missing tables ${rel.source_table} -> ${rel.target_table}`);
                    }
                }
            });
        }
        
        console.log("Links created:", links.length);
        console.log("Links detail:", links);
        
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
        
        // If there's no data, return early
        if (nodes.length === 0) {
            this.showNoDataMessage();
            return;
        }
        
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

        // Add the container to the SVG and initially zoom out to see everything
        this.svg.call(zoom).call(
            zoom.transform, 
            d3.zoomIdentity.translate(this.width / 4, this.height / 4).scale(0.5)
        );
        
        // Create a force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(300))
            .force('charge', d3.forceManyBody().strength(-3000))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(140));
            
        // Create links with more visibility
        const link = container.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('class', d => `link ${this.getRelationshipClass(d.type)}`)
            .attr('id', d => `link-${d.id}`)
            .attr('stroke-width', 2.5)
            .attr('fill', 'none')
            .attr('stroke', d => this.getRelationshipColor(d.type))
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
                
        // Create table rectangles with a white fill and blue border
        node.append('rect')
            .attr('width', 200)
            .attr('height', d => 30 + d.columns.length * 24)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', 'white')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2);
            
        // Create table name text
        node.append('text')
            .attr('x', 100)
            .attr('y', 20)
            .attr('class', 'table-name')
            .attr('text-anchor', 'middle')
            .attr('font-weight', 'bold')
            .attr('font-size', '14px')
            .text(d => this.truncateText(d.label, 20));
            
        // Create horizontal line separator
        node.append('line')
            .attr('x1', 0)
            .attr('y1', 30)
            .attr('x2', 200)
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
            .attr('transform', (d, i) => `translate(5, ${40 + i * 24})`);
            
        // Create column background
        columnGroups.append('rect')
            .attr('width', 190)
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
            
        // Create column name text - ensure it's not too long
        columnGroups.append('text')
            .attr('x', 5)
            .attr('y', 15)
            .attr('class', 'column-name')
            .attr('font-size', '12px')
            .text(d => {
                let prefix = '';
                if (d.primary_key) prefix = '🔑 ';
                else if (d.foreign_key) prefix = '🔗 ';
                return prefix + this.truncateText(d.name, 12);
            });
            
        // Create column type text - ensure it's not too long and positioned correctly
        columnGroups.append('text')
            .attr('x', 185)
            .attr('y', 15)
            .attr('text-anchor', 'end')
            .attr('class', 'column-type')
            .attr('font-size', '12px')
            .attr('fill', '#777')
            .text(d => this.truncateText(this.formatColumnType(d.type), 8));
            
        // Update positions on each tick of the simulation
        this.simulation.on('tick', () => {
            // Update link paths with improved drawing
            link.attr('d', d => {
                // Ensure source and target exist
                if (!d.source || !d.target) return '';
                
                // Handle both string IDs and object references
                const sourceNode = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
                const targetNode = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
                
                if (!sourceNode || !targetNode) return '';
                
                // Calculate the total height of each node based on column count
                const sourceHeight = 30 + (sourceNode.columns ? sourceNode.columns.length * 24 : 0);
                const targetHeight = 30 + (targetNode.columns ? targetNode.columns.length * 24 : 0);
                
                // Calculate source and target points
                const sourceX = sourceNode.x + 100; // middle of the node
                const sourceY = sourceNode.y + sourceHeight / 2;
                const targetX = targetNode.x + 100; // middle of the node
                const targetY = targetNode.y + targetHeight / 2;
                
                // Calculate control points for curved path with increased curve
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
                
                return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
            });
            
            // Update node positions
            node.attr('transform', d => `translate(${d.x - 100},${d.y - 15})`);
        });

        // Run simulation for a few iterations to settle the layout
        this.simulation.alpha(1).restart();
        for (let i = 0; i < 50; ++i) this.simulation.tick();
    }

    /**
     * Truncate text if it's too long
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '...';
    }
    
    /**
     * Get color for relationship type
     */
    getRelationshipColor(type) {
        switch (type) {
            case '1:1': return '#3498db'; // blue
            case '1:M': return '#e67e22'; // orange
            case 'M:1': return '#9b59b6'; // purple
            case 'M:M': return '#2ecc71'; // green
            default: return '#95a5a6';    // gray
        }
    }
    
    /**
     * Show a message when no data is available
     */
    showNoDataMessage() {
        const messageGroup = this.svg.append('g')
            .attr('class', 'no-data-message')
            .attr('transform', `translate(${this.width/2}, ${this.height/2})`);
            
        messageGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '20px')
            .attr('fill', '#95a5a6')
            .text('No database schema data available');
            
        messageGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('fill', '#95a5a6')
            .attr('y', 30)
            .text('Please connect to a database to visualize relationships');
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
            (link.source === tableName || link.source.id === tableName) && 
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