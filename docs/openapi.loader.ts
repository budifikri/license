// OpenAPI Documentation Loader
// This utility loads all separated YAML documentation files and combines them

import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load a YAML file and return its content as an object
function loadYamlFile(filePath: string): any {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContent) as any;
}

// Load all OpenAPI specification files
function loadAllSpecs(): any[] {
  const specsDir = path.join(path.dirname(__dirname), 'openapi');  // Go up one level to project root, then to openapi folder
  const specFiles = fs.readdirSync(specsDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
  const specs = [];
  
  for (const file of specFiles) {
    const specPath = path.join(specsDir, file);
    const spec = loadYamlFile(specPath);
    specs.push(spec);
  }
  
  return specs;
}

// Merge multiple OpenAPI specs into one
function mergeSpecs(specs: any[]): any {
  if (specs.length === 0) return null;
  
  // Start with the main spec
  const mainSpec = { ...specs[0] };
  
  // Merge paths from all specs
  mainSpec.paths = {};
  mainSpec.tags = [];
  mainSpec.components = { schemas: {}, securitySchemes: {} };
  
  for (const spec of specs) {
    // Merge paths
    if (spec.paths) {
      Object.assign(mainSpec.paths, spec.paths);
    }
    
    // Merge tags
    if (spec.tags) {
      mainSpec.tags = [...mainSpec.tags, ...spec.tags];
    }
    
    // Merge components
    if (spec.components) {
      if (spec.components.schemas) {
        Object.assign(mainSpec.components.schemas, spec.components.schemas);
      }
      if (spec.components.securitySchemes) {
        Object.assign(mainSpec.components.securitySchemes, spec.components.securitySchemes);
      }
    }
  }
  
  return mainSpec;
}

// Export the combined specification
export const openApiSpec = mergeSpecs(loadAllSpecs());

// Export individual loader functions
export { loadYamlFile, loadAllSpecs, mergeSpecs };