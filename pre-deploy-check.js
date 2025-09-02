#!/usr/bin/env node

// Pre-deployment verification script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AI Trading Boost - Pre-deployment Check\n');

const checks = {
  'Frontend package.json': 'frontend/package.json',
  'Root package.json': 'package.json',
  'Vercel config': 'vercel.json',
  'Production env': 'frontend/.env.production',
  'Supabase client': 'frontend/lib/supabase.ts',
  'MT5 integration': 'frontend/lib/mt5-integration.ts',
  'API client': 'frontend/lib/api-client.ts',
  'Frontend dist': 'frontend/dist'
};

let allChecks = true;

console.log('📋 File Structure Check:');
Object.entries(checks).forEach(([name, filePath]) => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  console.log(`  ${exists ? '✅' : '❌'} ${name}: ${filePath}`);
  if (!exists && filePath !== 'frontend/dist') {
    allChecks = false;
  }
});

console.log('\n🔧 Configuration Check:');

// Check if build exists
const distExists = fs.existsSync(path.join(__dirname, 'frontend/dist'));
console.log(`  ${distExists ? '✅' : '⚠️'} Build artifacts: ${distExists ? 'Present' : 'Missing (run npm run build)'}`);

// Check environment variables
const envProdPath = path.join(__dirname, 'frontend/.env.production');
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  console.log(`  ${hasSupabaseUrl ? '✅' : '❌'} Supabase URL configured`);
  console.log(`  ${hasSupabaseKey ? '✅' : '❌'} Supabase API key configured`);
} else {
  console.log('  ❌ Production environment file missing');
  allChecks = false;
}

// Check package.json scripts
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
  const hasVercelBuildScript = packageJson.scripts && packageJson.scripts['vercel-build'];
  
  console.log(`  ${hasBuildScript ? '✅' : '❌'} Build script configured`);
  console.log(`  ${hasVercelBuildScript ? '✅' : '❌'} Vercel build script configured`);
}

console.log('\n📊 Summary:');

if (allChecks) {
  console.log('✅ All checks passed! Ready for Vercel deployment.');
  console.log('\n🚀 Next steps:');
  console.log('1. Push to GitHub: git push origin main');
  console.log('2. Connect to Vercel: https://vercel.com');
  console.log('3. Import repository and deploy');
  console.log('4. Add environment variables in Vercel dashboard');
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deployment.');
  process.exit(1);
}

console.log('\n📖 For detailed deployment instructions, see:');
console.log('   - DEPLOY_MANUAL.md');
console.log('   - DEPLOYMENT_GUIDE.md');

console.log('\n🔗 Important URLs:');
console.log('   - Vercel: https://vercel.com');
console.log('   - Supabase: https://jeewrxgqkgvtrphebcxz.supabase.co');
console.log('   - GitHub Actions: .github/workflows/deploy.yml');