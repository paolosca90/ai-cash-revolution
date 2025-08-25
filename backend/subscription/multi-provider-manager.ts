// Sistema Multi-Provider per VPS automatico
import axios from 'axios';

interface VPSProvider {
  id: string;
  name: string;
  costPerMonth: number;
  freeInstancesAvailable: number;
  apiKey: string;
  regions: string[];
  specs: {
    cpu: number;
    ram: number;
    storage: number;
  };
}

class MultiProviderVPSManager {
  private providers: VPSProvider[] = [
    {
      id: 'oracle',
      name: 'Oracle Cloud',
      costPerMonth: 0,
      freeInstancesAvailable: 2, // Track available free instances
      apiKey: process.env.ORACLE_API_KEY || '',
      regions: ['us-ashburn', 'eu-frankfurt'],
      specs: { cpu: 1, ram: 1, storage: 50 }
    },
    {
      id: 'aws-free',
      name: 'AWS Free Tier',
      costPerMonth: 0,
      freeInstancesAvailable: 1,
      apiKey: process.env.AWS_API_KEY || '',
      regions: ['us-east-1', 'eu-west-1'],
      specs: { cpu: 1, ram: 1, storage: 30 }
    },
    {
      id: 'contabo',
      name: 'Contabo',
      costPerMonth: 4.99,
      freeInstancesAvailable: 0,
      apiKey: process.env.CONTABO_API_KEY || '',
      regions: ['eu-west'],
      specs: { cpu: 2, ram: 4, storage: 50 }
    },
    {
      id: 'vultr',
      name: 'Vultr',
      costPerMonth: 10,
      freeInstancesAvailable: 0,
      apiKey: process.env.VULTR_API_KEY || '',
      regions: ['ewr', 'fra'],
      specs: { cpu: 1, ram: 1, storage: 25 }
    }
  ];

  // Strategia intelligente selezione provider
  async selectOptimalProvider(planType: 'basic' | 'premium' | 'enterprise'): Promise<VPSProvider> {
    // Per piano Basic - usa sempre gratuito se disponibile
    if (planType === 'basic') {
      // Prova Oracle Cloud prima
      const oracle = this.providers.find(p => p.id === 'oracle');
      if (oracle && oracle.freeInstancesAvailable > 0) {
        return oracle;
      }
      
      // Poi AWS Free Tier
      const aws = this.providers.find(p => p.id === 'aws-free');
      if (aws && aws.freeInstancesAvailable > 0) {
        return aws;
      }
      
      // Fallback a Contabo economico
      return this.providers.find(p => p.id === 'contabo')!;
    }
    
    // Per Premium - Contabo (miglior rapporto qualità/prezzo)
    if (planType === 'premium') {
      return this.providers.find(p => p.id === 'contabo')!;
    }
    
    // Per Enterprise - Vultr (massima affidabilità)
    return this.providers.find(p => p.id === 'vultr')!;
  }

  async createVPSInstance(userId: number, planType: 'basic' | 'premium' | 'enterprise') {
    const provider = await this.selectOptimalProvider(planType);
    
    console.log(`🚀 Creating VPS for user ${userId} on ${provider.name} (€${provider.costPerMonth}/month)`);
    
    switch (provider.id) {
      case 'oracle':
        return this.createOracleInstance(userId, provider);
      case 'aws-free':
        return this.createAWSInstance(userId, provider);
      case 'contabo':
        return this.createContaboInstance(userId, provider);
      case 'vultr':
        return this.createVultrInstance(userId, provider);
      default:
        throw new Error('Provider non supportato');
    }
  }

  private async createOracleInstance(userId: number, provider: VPSProvider) {
    try {
      // Oracle Cloud API call (semplificato)
      const response = await axios.post('https://compute.eu-frankfurt-1.oraclecloud.com/20160918/instances', {
        compartmentId: process.env.ORACLE_COMPARTMENT_ID,
        displayName: `trading-bot-user-${userId}`,
        imageId: process.env.ORACLE_WINDOWS_IMAGE_ID,
        shape: 'VM.Standard.E2.1.Micro', // Always Free eligible
        // ... altri parametri Oracle Cloud
      }, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Decrementa istanze gratuite disponibili
      const oracleProvider = this.providers.find(p => p.id === 'oracle');
      if (oracleProvider) {
        oracleProvider.freeInstancesAvailable--;
      }

      return {
        success: true,
        provider: 'oracle',
        instance_id: response.data.id,
        ip_address: response.data.primaryPrivateIp, // Da configurare
        monthly_cost: 0
      };
    } catch (error) {
      console.error('Oracle VPS creation failed:', error);
      
      // Fallback a provider successivo
      console.log('🔄 Fallback to next provider...');
      return this.createContaboInstance(userId, this.providers.find(p => p.id === 'contabo')!);
    }
  }

  private async createContaboInstance(userId: number, provider: VPSProvider) {
    try {
      // Contabo API (più semplice)
      const response = await axios.post('https://api.contabo.com/v1/compute/instances', {
        imageId: 'win2019-std-x64',
        productId: 'VPS-1-SSD-EU',
        region: 'EU',
        displayName: `trading-bot-${userId}`,
        // Configurazione Windows
      }, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        provider: 'contabo',
        instance_id: response.data.instanceId,
        ip_address: response.data.ipConfig.v4.ip,
        monthly_cost: 4.99
      };
    } catch (error) {
      console.error('Contabo VPS creation failed:', error);
      throw new Error(`Contabo VPS creation failed: ${error.message}`);
    }
  }

  private async createVultrInstance(userId: number, provider: VPSProvider) {
    // Implementazione Vultr esistente
    try {
      const response = await axios.post('https://api.vultr.com/v2/instances', {
        region: 'ewr',
        plan: 'vc2-1c-1gb',
        os_id: '124', // Windows
        label: `trading-bot-user-${userId}`
      }, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        provider: 'vultr',
        instance_id: response.data.instance.id,
        ip_address: response.data.instance.main_ip,
        monthly_cost: 10
      };
    } catch (error) {
      console.error('Vultr VPS creation failed:', error);
      throw new Error(`Vultr VPS creation failed: ${error.message}`);
    }
  }

  // Funzione per tracciare costi e ottimizzare
  async getCostProjection(expectedNewUsers: number) {
    let totalCost = 0;
    let freeInstancesUsed = 0;

    // Simula allocazione ottimale
    for (let i = 0; i < expectedNewUsers; i++) {
      // 60% Basic, 30% Premium, 10% Enterprise
      const rand = Math.random();
      let planType: 'basic' | 'premium' | 'enterprise';
      
      if (rand < 0.6) planType = 'basic';
      else if (rand < 0.9) planType = 'premium';
      else planType = 'enterprise';

      const provider = await this.selectOptimalProvider(planType);
      
      if (provider.costPerMonth === 0 && provider.freeInstancesAvailable > freeInstancesUsed) {
        freeInstancesUsed++;
        // Costo €0
      } else {
        totalCost += provider.costPerMonth;
      }
    }

    return {
      expectedUsers: expectedNewUsers,
      totalMonthlyCost: totalCost,
      freeInstancesUsed,
      averageCostPerUser: totalCost / expectedNewUsers,
      breakdown: {
        free: freeInstancesUsed,
        contabo: Math.ceil((expectedNewUsers * 0.6) - freeInstancesUsed),
        vultr: Math.ceil(expectedNewUsers * 0.4)
      }
    };
  }

  // Migrazione automatica se provider gratuito si esaurisce
  async migrateToFallbackProvider(instanceId: string, currentProvider: string) {
    console.log(`🔄 Migrating instance ${instanceId} from ${currentProvider}`);
    
    // Logica migrazione automatica
    // 1. Backup configurazione utente
    // 2. Crea nuova istanza su provider alternativo
    // 3. Trasferisci configurazione
    // 4. Aggiorna database
    // 5. Elimina vecchia istanza
  }
}

export const vpsManager = new MultiProviderVPSManager();

// API endpoint aggiornato
export async function createVPSForUser(userId: number, planType: 'basic' | 'premium' | 'enterprise') {
  try {
    const result = await vpsManager.createVPSInstance(userId, planType);
    
    // Salva nel database con provider e costo
    await pool.query(`
      INSERT INTO client_vps_instances (
        client_id, provider, instance_id, ip_address, 
        monthly_cost, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'creating', CURRENT_TIMESTAMP)
    `, [userId, result.provider, result.instance_id, result.ip_address, result.monthly_cost]);

    return result;
  } catch (error) {
    console.error(`VPS creation failed for user ${userId}:`, error);
    throw error;
  }
}