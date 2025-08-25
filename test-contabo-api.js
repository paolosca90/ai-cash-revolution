// Test Script per Contabo API
const axios = require('axios');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
})};

// Le tue credenziali Contabo
const CONTABO_CLIENT_ID = 'INT-14177978';
const CONTABO_CLIENT_SECRET = 'lOUefgVuRXPyVxJuGGQDFSCdODjdpSYp';
const CONTABO_API_USER = 'paoloscardia@gmail.com';
const CONTABO_API_PASSWORD = '782789Pao!';

async function testContaboAPI() {
  console.log('🔐 Testing Contabo API authentication...');
  
  try {
    // 1. Ottieni access token
    console.log('Step 1: Getting access token...');
    
    const tokenResponse = await axios.post(
      'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token',
      new URLSearchParams({
        'grant_type': 'password',
        'client_id': CONTABO_CLIENT_ID,
        'client_secret': CONTABO_CLIENT_SECRET,
        'username': CONTABO_API_USER,
        'password': CONTABO_API_PASSWORD,
        'scope': 'openid'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token ottenuto!');
    console.log('Token expires in:', tokenResponse.data.expires_in, 'seconds');
    
    // 2. Test API call - Lista istanze esistenti
    console.log('\nStep 2: Testing API endpoints...');
    
    const instancesResponse = await axios.get(
      'https://api.contabo.com/v1/compute/instances',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-request-id': uuidv4()
        }
      }
    );
    
    console.log('✅ API call riuscita!');
    console.log('Istanze esistenti:', instancesResponse.data.data?.length || 0);
    
    // 3. Test disponibilità prodotti
    console.log('\nStep 3: Checking available products...');
    
    try {
      const productsResponse = await axios.get(
        'https://api.contabo.com/v1/compute/images',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-request-id': uuidv4()
          }
        }
      );
      
      console.log('✅ Prodotti disponibili:');
      if (productsResponse.data.data) {
        productsResponse.data.data.slice(0, 5).forEach(image => {
          console.log(`- ${image.name} (${image.imageId})`);
        });
      }
    } catch (productError) {
      console.log('⚠️ Products endpoint not accessible:', productError.response?.status);
    }
    
    console.log('\n🎉 Contabo API test COMPLETATO CON SUCCESSO!');
    console.log('\n✅ Il sistema è pronto per creare VPS automaticamente!');
    console.log('\nMargin calculation:');
    console.log('- Piano Basic €29: Costo VPS €6 = Margine €23 (383%)');
    console.log('- Piano Premium €59: Costo VPS €10 = Margine €49 (490%)'); 
    console.log('- Piano Enterprise €99: Costo VPS €19 = Margine €80 (421%)');
    
  } catch (error) {
    console.error('❌ Contabo API test FALLITO:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n🔍 Possibili cause:');
        console.error('1. Credenziali API non valide');
        console.error('2. Account non abilitato per API');
        console.error('3. Client ID/Secret errati');
      }
    } else {
      console.error('Network Error:', error.message);
    }
    
    console.error('\n💡 Soluzioni:');
    console.error('1. Verifica credenziali nel pannello Contabo');
    console.error('2. Controlla che API siano abilitate');
    console.error('3. Prova a rigenerare Client Secret');
  }
}

// Esegui il test
testContaboAPI();