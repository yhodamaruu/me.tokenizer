import axios from 'axios';

const config = {
  API_URL: 'http://localhost:3000/api',
  MASTER_PASSWORD: 'SuperSecretPassword123!',
  TEST_VALUE: '444-783-333-383'
};

async function testTokenizer() {
  try {
    console.log('🚀 Début du test...');
    
    console.log(`\n🔐 Création du token pour: ${config.TEST_VALUE}`);
    const { data: { token } } = await axios.post(`${config.API_URL}/tokenize`, {
      value: config.TEST_VALUE,
      password: config.MASTER_PASSWORD
    });
    
    console.log('✅ Token généré (tronqué):', token.slice(0, 30) + '...');

    console.log('\n🔓 Tentative de détokenisation...');
    const { data } = await axios.post(`${config.API_URL}/resolve`, {
      token,
      password: config.MASTER_PASSWORD
    });
    
    console.log('✅ Valeur originale:', data.originalValue);
    console.log('\n🎉 Test réussi!');

  } catch (error) {
    console.error('\n💥 Erreur:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testTokenizer();