import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, CheckCircle, MessageSquare } from "lucide-react";

interface AnalyticsProps {
  stats: {
    total_tickets: number;
    resolved_tickets: number;
    avg_response_time_minutes: number;
    satisfaction_rate: number;
    emails_processed: number;
  } | null;
  tickets: Array<{
    id: string;
    created_at: string;
    status: string;
    resolved_at: string | null;
  }>;
}

export function Analytics({ stats, tickets }: AnalyticsProps) {
  // Calculate tickets per day (last 7 days)
  const ticketsPerDay = () => {
    const days: { [key: string]: number } = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { weekday: 'short' });
      days[key] = 0;
    }
    
    tickets.forEach(ticket => {
      const ticketDate = new Date(ticket.created_at);
      const diffDays = Math.floor((today.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 6) {
        const key = ticketDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (days[key] !== undefined) {
          days[key]++;
        }
      }
    });
    
    return Object.entries(days).map(([name, tickets]) => ({ name, tickets }));
  };

  // Status distribution for pie chart
  const statusDistribution = () => {
    const distribution: { [key: string]: number } = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
    };
    
    tickets.forEach(ticket => {
      if (distribution[ticket.status] !== undefined) {
        distribution[ticket.status]++;
      }
    });
    
    return [
      { name: 'Open', value: distribution.open, color: 'hsl(var(--destructive))' },
      { name: 'In Progress', value: distribution['in-progress'], color: 'hsl(var(--warning, 45 93% 47%))' },
      { name: 'Resolved', value: distribution.resolved, color: 'hsl(var(--primary))' },
    ].filter(item => item.value > 0);
  };

  // Response time trend (mock data for now - would need historical data)
  const responseTimeTrend = [
    { name: 'Mon', time: stats?.avg_response_time_minutes || 0 },
    { name: 'Tue', time: (stats?.avg_response_time_minutes || 0) * 0.9 },
    { name: 'Wed', time: (stats?.avg_response_time_minutes || 0) * 1.1 },
    { name: 'Thu', time: (stats?.avg_response_time_minutes || 0) * 0.85 },
    { name: 'Fri', time: (stats?.avg_response_time_minutes || 0) * 0.95 },
    { name: 'Sat', time: (stats?.avg_response_time_minutes || 0) * 0.8 },
    { name: 'Sun', time: (stats?.avg_response_time_minutes || 0) * 0.75 },
  ];

  const ticketData = ticketsPerDay();
  const pieData = statusDistribution();
  const resolutionRate = stats && stats.total_tickets > 0 
    ? Math.round((stats.resolved_tickets / stats.total_tickets) * 100) 
    : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics Overview</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold text-foreground">{stats?.total_tickets || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-3xl font-bold text-foreground">{resolutionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatTime(stats?.avg_response_time_minutes || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.satisfaction_rate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Per Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets Per Day (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No ticket data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Response Time Trend (Minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${Math.round(value)} min`, 'Response Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
