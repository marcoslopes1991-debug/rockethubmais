import { useAdMetrics } from "@/hooks/useAds";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, MousePointerClick, TrendingUp } from "lucide-react";

const AdMetricsPanel = () => {
  const { metrics, loading } = useAdMetrics();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-6 text-sm">
        Nenhuma métrica disponível ainda.
      </p>
    );
  }

  // Totals
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Eye className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Impressões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <MousePointerClick className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Cliques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{totalCtr.toFixed(1)}%</p>
            <p className="text-[11px] text-muted-foreground">CTR</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-ad breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Por anúncio</h4>
        {metrics.map((m) => (
          <Card key={m.ad_id}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 mr-3">{m.title}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {m.impressions}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" /> {m.clicks}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {m.ctr.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdMetricsPanel;
