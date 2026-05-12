-- ============================================================
-- SCHEMA SUPABASE - SAAS LOJA DE ROUPAS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles (usuários da loja)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  store_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: groups (grupos de produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: categories (categorias de produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: products (produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sku, user_id)
);

-- ============================================================
-- TABELA: sellers (vendedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_code TEXT NOT NULL,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_code, user_id)
);

-- ============================================================
-- TABELA: payment_methods (formas de pagamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'pix')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: customers (clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  email TEXT,
  profession TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cpf, user_id)
);

-- ============================================================
-- TABELA: sales (vendas - cabeçalho)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number SERIAL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: sale_items (itens da venda)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: stock_entries (entradas de estoque — relacionamento por SKU)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por SKU
CREATE INDEX IF NOT EXISTS idx_stock_entries_sku ON public.stock_entries(sku, user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sku ON public.sale_items(sku, user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuário vê apenas seus próprios dados
CREATE POLICY "stock_entries_own" ON public.stock_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "groups_own" ON public.groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "categories_own" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "products_own" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sellers_own" ON public.sellers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "payment_methods_own" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "customers_own" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sales_own" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sale_items_own" ON public.sale_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: criar perfil após registro
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DADOS INICIAIS: formas de pagamento padrão
-- (Execute após criar seu primeiro usuário e substitua o UUID)
-- INSERT INTO public.payment_methods (name, type, user_id) VALUES
--   ('Débito', 'debit', 'SEU-USER-ID'),
--   ('Crédito', 'credit', 'SEU-USER-ID'),
--   ('PIX', 'pix', 'SEU-USER-ID');
-- ============================================================

-- FIM DO SCHEMA

-- ============================================================
-- NOTA: RELACIONAMENTO POR SKU
-- ============================================================
-- O SKU é a chave de negócio central do sistema.
-- A tabela products armazena o cadastro mestre do SKU.
-- A tabela stock_entries registra cada entrada de estoque por SKU.
-- A tabela sale_items registra cada saída (venda) por SKU.
-- 
-- POSIÇÃO DE ESTOQUE (por SKU):
--   SELECT 
--     e.sku,
--     e.description,
--     SUM(e.quantity) AS total_entradas,
--     COALESCE(s.total_vendido, 0) AS total_vendido,
--     SUM(e.quantity) - COALESCE(s.total_vendido, 0) AS saldo
--   FROM stock_entries e
--   LEFT JOIN (
--     SELECT sku, SUM(quantity) AS total_vendido FROM sale_items GROUP BY sku
--   ) s ON s.sku = e.sku
--   GROUP BY e.sku, e.description, s.total_vendido;
-- ============================================================
