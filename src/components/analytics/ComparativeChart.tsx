import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ComparativeChartProps {
  data: any[];
  title: string;
  type?: 'bar' | 'line';
  dataKey1: string;
  dataKey2: string;
  label1: string;
  label2: string;
}

export const ComparativeChart = ({
  data,
  title,
  type = 'bar',
  dataKey1,
  dataKey2,
  label1,
  label2,
}: ComparativeChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={dataKey1}
                fill="hsl(var(--primary))"
                name={label1}
              />
              <Bar
                dataKey={dataKey2}
                fill="hsl(var(--accent))"
                name={label2}
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey1}
                stroke="hsl(var(--primary))"
                name={label1}
              />
              <Line
                type="monotone"
                dataKey={dataKey2}
                stroke="hsl(var(--accent))"
                name={label2}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
