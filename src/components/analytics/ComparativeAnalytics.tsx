import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComparativeChart } from "./ComparativeChart";
import { tasksApi } from "@/lib/api-client";
import { TrendingUp } from "lucide-react";

interface Zone {
  id: string;
  name: string;
}

export const ComparativeAnalytics = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [period1Start, setPeriod1Start] = useState<string>("");
  const [period1End, setPeriod1End] = useState<string>("");
  const [period2Start, setPeriod2Start] = useState<string>("");
  const [period2End, setPeriod2End] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const { zonesApi } = await import("@/lib/api-client");
      const data = await zonesApi.getAllZones();
      setZones(data);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadComparativeData = async () => {
    if (!selectedZone || !period1Start || !period1End || !period2Start || !period2End) {
      return;
    }

    setLoading(true);
    try {
      const data = await tasksApi.getComparativeAnalytics({
        zoneIds: [selectedZone],
        startDate1: period1Start,
        endDate1: period1End,
        startDate2: period2Start,
        endDate2: period2End,
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading comparative analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!analyticsData) return [];

    return [
      {
        name: 'Средний балл',
        period1: analyticsData.period1?.avgGrade || 0,
        period2: analyticsData.period2?.avgGrade || 0,
      },
      {
        name: 'Всего работ',
        period1: analyticsData.period1?.totalSubmissions || 0,
        period2: analyticsData.period2?.totalSubmissions || 0,
      },
      {
        name: 'Проверено',
        period1: analyticsData.period1?.reviewedCount || 0,
        period2: analyticsData.period2?.reviewedCount || 0,
      },
    ];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Сравнительная аналитика
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Зона</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите зону" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Период 1</h3>
              <div className="space-y-2">
                <Label>Начало</Label>
                <Input
                  type="date"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Конец</Label>
                <Input
                  type="date"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Период 2</h3>
              <div className="space-y-2">
                <Label>Начало</Label>
                <Input
                  type="date"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Конец</Label>
                <Input
                  type="date"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={loadComparativeData}
            disabled={loading || !selectedZone || !period1Start || !period1End || !period2Start || !period2End}
            className="w-full"
          >
            {loading ? 'Загрузка...' : 'Сравнить периоды'}
          </Button>
        </CardContent>
      </Card>

      {analyticsData && (
        <ComparativeChart
          data={prepareChartData()}
          title="Сравнение периодов"
          type="bar"
          dataKey1="period1"
          dataKey2="period2"
          label1={`${period1Start} - ${period1End}`}
          label2={`${period2Start} - ${period2End}`}
        />
      )}
    </div>
  );
};
