import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-public-key-here'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for TypeScript
export interface User {
  id: string
  email: string
  name: string
  subscription_tier: string
  subscription_status: string
  subscription_expires?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  risk_percentage: number
  account_balance: number
  max_trades: number
  preferred_symbols: string[]
  trading_hours: {
    start: string
    end: string
  }
  created_at: string
  updated_at: string
}

export interface TradingAccount {
  id: string
  user_id: string
  account_type: string
  account_name: string
  broker_name?: string
  server_url?: string
  account_number?: string
  api_key?: string
  is_active: boolean
  last_connection?: string
  created_at: string
  updated_at: string
}

export interface TradingOrder {
  id: string
  user_id: string
  account_id: string
  symbol: string
  order_type: string
  volume: number
  open_price?: number
  close_price?: number
  stop_loss?: number
  take_profit?: number
  status: string
  profit: number
  comment?: string
  opened_at: string
  closed_at?: string
  created_at: string
}

export interface TradingSignal {
  id: string
  symbol: string
  signal_type: string
  strength: number
  entry_price?: number
  stop_loss?: number
  take_profit?: number
  confidence?: number
  strategy?: string
  timeframe: string
  status: string
  created_at: string
  expires_at: string
}

// Authentication helpers
export const signUp = async (email: string, password: string, userData: { name: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  
  if (error) throw error
  
  // Create user profile in public.users table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: email,
        name: userData.name,
        subscription_tier: 'free',
        subscription_status: 'trial'
      }])
    
    if (profileError) {
      console.warn('Profile creation error:', profileError)
    }
  }
  
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Database helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const getUserPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const updateUserPreferences = async (userId: string, preferences: Partial<UserPreferences>) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert([{
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getTradingAccounts = async (userId: string) => {
  const { data, error } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const addTradingAccount = async (account: Omit<TradingAccount, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('trading_accounts')
    .insert([{
      ...account,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getTradingOrders = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('trading_orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

export const getTradingSignals = async (limit = 20) => {
  const { data, error } = await supabase
    .from('trading_signals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

export const getMLAnalytics = async () => {
  const { data, error } = await supabase
    .from('ml_analytics')
    .select('*')
    .eq('status', 'active')
    .order('last_trained', { ascending: false })
  
  if (error) throw error
  return data
}

export const getMarketData = async (symbol: string, timeframe: string, limit = 100) => {
  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}