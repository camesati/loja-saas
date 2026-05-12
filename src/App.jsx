import { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PDV from "./pages/PDV.jsx";
import Products from "./pages/Products.jsx";
import StockEntries from "./pages/StockEntries.jsx";
import Customers from "./pages/Customers.jsx";
import Sellers from "./pages/Sellers.jsx";
import PaymentMethods from "./pages/PaymentMethods.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

const PAGES = {
  dashboard:   Dashboard,
  pdv:         PDV,
  products:    Products,
  stock:       StockEntries,
  customers:   Customers,
  sellers:     Sellers,
  payments:    PaymentMethods,
  reports:     Reports,
  settings:    Settings,
};

export default function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Login />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <Layout page={page} setPage={setPage}>
      <PageComponent setPage={setPage} />
    </Layout>
  );
}
