import Header from "@/components/layout/header";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Analytics" 
        subtitle="Comprehensive reporting and predictive insights"
      />
      <AnalyticsDashboard />
    </div>
  );
}
