/**
 * Template Utilities
 * Functions for instantiating workflow templates with variable substitution and ID remapping
 */

/**
 * Generate a unique ID for nodes and connections
 */
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract all placeholder variables from a template
 * Placeholders are in the format {{variableName}}
 * 
 * @param {Object} template - The template object with nodes and connections
 * @returns {Array<string>} - Array of unique variable names
 */
export function extractTemplateVariables(template) {
  const variables = new Set();
  const regex = /\{\{(\w+)\}\}/g;

  // Extract from template metadata
  if (template.name) {
    let match;
    while ((match = regex.exec(template.name)) !== null) {
      variables.add(match[1]);
    }
  }

  if (template.description) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(template.description)) !== null) {
      variables.add(match[1]);
    }
  }

  // Extract from nodes
  if (template.nodes && Array.isArray(template.nodes)) {
    template.nodes.forEach(node => {
      // Check node label
      if (node.label) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(node.label)) !== null) {
          variables.add(match[1]);
        }
      }

      // Check node description
      if (node.description) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(node.description)) !== null) {
          variables.add(match[1]);
        }
      }

      // Check all string properties in node object
      Object.values(node).forEach(value => {
        if (typeof value === 'string') {
          let match;
          regex.lastIndex = 0;
          while ((match = regex.exec(value)) !== null) {
            variables.add(match[1]);
          }
        }
      });
    });
  }

  return Array.from(variables).sort();
}

/**
 * Replace placeholders in a string with actual values
 * 
 * @param {string} text - Text containing placeholders
 * @param {Object} variables - Object mapping variable names to values
 * @returns {string} - Text with placeholders replaced
 */
function replacePlaceholders(text, variables) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  Object.keys(variables).forEach(varName => {
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
    result = result.replace(regex, variables[varName] || '');
  });
  
  return result;
}

/**
 * Deep clone and process an object, replacing placeholders
 * 
 * @param {*} obj - Object to process
 * @param {Object} variables - Variable mappings
 * @returns {*} - Processed copy of object
 */
function deepProcessObject(obj, variables) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return replacePlaceholders(obj, variables);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepProcessObject(item, variables));
  }
  
  if (typeof obj === 'object') {
    const processed = {};
    Object.keys(obj).forEach(key => {
      processed[key] = deepProcessObject(obj[key], variables);
    });
    return processed;
  }
  
  return obj;
}

/**
 * Instantiate a template by remapping IDs and replacing placeholders
 * 
 * @param {Object} template - The template object
 * @param {Object} variables - Object mapping variable names to replacement values
 * @returns {Object} - Instantiated workflow with new IDs and replaced variables
 */
export function instantiateTemplate(template, variables = {}) {
  if (!template || typeof template !== 'object') {
    throw new Error('Invalid template: must be an object');
  }

  // Create ID mapping for nodes
  const nodeIdMap = new Map();
  
  // Process nodes
  const newNodes = [];
  if (template.nodes && Array.isArray(template.nodes)) {
    template.nodes.forEach(node => {
      const oldId = node.id;
      const newId = generateUniqueId();
      nodeIdMap.set(oldId, newId);
      
      // Deep clone and process node
      const processedNode = deepProcessObject(node, variables);
      
      // Update node ID
      processedNode.id = newId;
      
      newNodes.push(processedNode);
    });
  }

  // Process connections with remapped node IDs
  const newConnections = [];
  if (template.connections && Array.isArray(template.connections)) {
    template.connections.forEach(conn => {
      // Deep clone and process connection
      const processedConn = deepProcessObject(conn, variables);
      
      // Generate new connection ID
      processedConn.id = generateUniqueId();
      
      // Remap source and target node IDs
      if (processedConn.source && nodeIdMap.has(processedConn.source)) {
        processedConn.source = nodeIdMap.get(processedConn.source);
      }
      
      if (processedConn.target && nodeIdMap.has(processedConn.target)) {
        processedConn.target = nodeIdMap.get(processedConn.target);
      }
      
      newConnections.push(processedConn);
    });
  }

  // Build the instantiated workflow
  const instantiated = {
    nodes: newNodes,
    connections: newConnections,
    name: replacePlaceholders(template.name || 'Untitled Workflow', variables),
    description: replacePlaceholders(template.description || '', variables),
  };

  // Copy over any additional metadata
  if (template.category) {
    instantiated.category = template.category;
  }
  
  if (template.tags) {
    instantiated.tags = Array.isArray(template.tags) ? [...template.tags] : template.tags;
  }

  return instantiated;
}

/**
 * Validate a template structure
 * 
 * @param {Object} template - Template to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateTemplate(template) {
  const errors = [];
  
  if (!template || typeof template !== 'object') {
    errors.push('Template must be an object');
    return { valid: false, errors };
  }
  
  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template must have a name');
  }
  
  if (!template.nodes || !Array.isArray(template.nodes)) {
    errors.push('Template must have a nodes array');
  } else {
    template.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing id`);
      }
      if (!node.label) {
        errors.push(`Node at index ${index} missing label`);
      }
    });
  }
  
  if (template.connections && !Array.isArray(template.connections)) {
    errors.push('Template connections must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default values for template variables
 * 
 * @param {Array<string>} variables - Array of variable names
 * @returns {Object} - Object with default empty values
 */
export function getDefaultVariableValues(variables) {
  const defaults = {};
  variables.forEach(varName => {
    defaults[varName] = '';
  });
  return defaults;
}
