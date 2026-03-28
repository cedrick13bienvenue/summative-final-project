import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../swagger/config';

// Target the public folder at the root of the project
const outputDir = path.join(__dirname, '../../public');
const outputFile = path.join(outputDir, 'swagger.json');

try {
  console.log("📦 Generating static API documentation...");

  // Ensure the public directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the swagger spec to a static JSON file
  fs.writeFileSync(outputFile, JSON.stringify(swaggerSpec, null, 2));
  
  console.log(`✅ Static Swagger documentation generated at: ${outputFile}`);
} catch (error) {
  console.error('❌ Failed to generate static swagger documentation:', error);
  process.exit(1);
}