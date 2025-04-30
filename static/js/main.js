document.addEventListener('DOMContentLoaded', function() {
    // Form and DOM elements
    const connectionForm = document.getElementById('connection-form');
    const dialectSelect = document.getElementById('dialect');
    const portInput = document.getElementById('port');
    const connectionStatus = document.getElementById('connection-status');
    const loadingOverlay = document.getElementById('loading-overlay');
    const diagramContainer = document.getElementById('diagram-container');
    
    // Update port when dialect changes
    dialectSelect.addEventListener('change', function() {
        const selectedOption = dialectSelect.options[dialectSelect.selectedIndex];
        const defaultPort = selectedOption.dataset.defaultPort;
        
        if (defaultPort) {
            portInput.value = defaultPort;
            portInput.placeholder = `Default: ${defaultPort}`;
        } else {
            portInput.value = '';
            portInput.placeholder = 'Default port';
        }
    });
    
    // Form submission handler
    connectionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Clear previous status messages
        connectionStatus.textContent = '';
        connectionStatus.className = 'status';
        
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');
        
        // Collect form data
        const formData = {
            dialect: dialectSelect.value,
            host: document.getElementById('host').value,
            port: document.getElementById('port').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            database: document.getElementById('database').value
        };
        
        // Call the API
        fetch('/inspect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
            
            // Check if we have relationships
            if (data.relationships && data.relationships.length === 0) {
                connectionStatus.textContent = 'Connection successful! No relationships detected in this database.';
                connectionStatus.className = 'status success';
            } else {
                // Log data for debugging
                console.log('Database schema data:', data);
                console.log('Tables:', data.tables.length);
                console.log('Relationships:', data.relationships.length);
                
                // Show success message
                connectionStatus.textContent = `Connection successful! Found ${data.tables.length} tables and ${data.relationships.length} relationships.`;
                connectionStatus.className = 'status success';
            }
            
            // Render the visualization
            if (window.visualizer) {
                window.visualizer.renderDiagram(data);
            } else {
                console.error('Visualizer not initialized');
            }
        })
        .catch(error => {
            // Hide loading overlay
            loadingOverlay.classList.add('hidden');
            
            // Show error message
            console.error('Error:', error);
            connectionStatus.textContent = `Connection failed: ${error.message}`;
            connectionStatus.className = 'status error';
        });
    });
    
    // Initialize the visualizer
    window.visualizer = new DatabaseVisualizer(diagramContainer);
});