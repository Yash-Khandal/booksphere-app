import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import Loader from '../layout/Loader';

// npm install @nivo/line @nivo/pie
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

export default function Progress() {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState('month'); // Changed default to month
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalReadingTime: '0h 0m',
    averageRating: 0,
    completionRate: 0,
  });
  const [readingData, setReadingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserProgress();
    }
  }, [timeRange, currentUser]);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate/update user progress in backend
      await supabase.rpc('calculate_user_progress', { 
        p_user_id: currentUser.id 
      });
      
      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        setStats({
          totalBooks: 0,
          totalReadingTime: '0h 0m',
          averageRating: 0,
          completionRate: 0,
        });
      } else if (statsData) {
        // Calculate hours and minutes properly
        const totalMinutes = statsData.total_reading_time || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        setStats({
          totalBooks: statsData.total_books || 0,
          totalReadingTime: `${hours}h ${minutes}m`,
          averageRating: parseFloat(statsData.average_rating || 0).toFixed(1),
          completionRate: statsData.completion_rate || 0,
        });
      }

      // Fetch reading activity for chart (better daily tracking)
      const { data: activityData } = await supabase
        .from('reading_sessions')
        .select('session_date, duration, pages_read')
        .eq('user_id', currentUser.id)
        .gte('session_date', getDateRange(timeRange))
        .order('session_date');

      setReadingData(processActivityData(activityData || []));

      // Category data for pie chart
      const { data: categoryData } = await supabase
        .from('user_books')
        .select(`books (type)`)
        .eq('user_id', currentUser.id)
        .eq('status', 'finished');
        
      setCategoryData(processCategoryData(categoryData || []));

    } catch (error) {
      console.error('Error fetching progress:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getDateRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  };

  const processActivityData = (data) => {
    if (!data || data.length === 0) {
      // Return last 7 days with zeros for better visualization
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push({
          x: date.toLocaleDateString('en', { weekday: 'short' }),
          y: 0
        });
      }
      return [{ id: 'reading time', data: last7Days }];
    }
    
    // Create a complete date range
    const startDate = new Date(getDateRange(timeRange));
    const endDate = new Date();
    const dateRange = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split('T')[0]);
    }
    
    // Group sessions by date
    const grouped = data.reduce((acc, session) => {
      const date = session.session_date;
      acc[date] = (acc[date] || 0) + (session.duration || 0);
      return acc;
    }, {});
    
    // Create chart data with all dates (including zeros)
    const chartData = dateRange.map(date => {
      const dateObj = new Date(date);
      return {
        x: timeRange === 'week' 
          ? dateObj.toLocaleDateString('en', { weekday: 'short' })
          : dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        y: Math.round((grouped[date] || 0) / 60 * 10) / 10 // minutes to hours, 1 decimal
      };
    });
    
    return [{ id: 'reading time', data: chartData }];
  };

  const processCategoryData = (data) => {
    if (!data || data.length === 0) {
      return [{ id: 'No books finished yet', value: 1 }];
    }
    
    const counts = data.reduce((acc, item) => {
      const type = item.books?.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([type, count]) => ({
      id: type,
      value: count
    }));
  };

  const StatCard = ({ icon, title, value, subtitle, color = 'primary' }) => (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 25px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease'
      }
    }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton 
            sx={{ 
              bgcolor: `${color}.light`, 
              color: `${color}.main`,
              '&:hover': { bgcolor: `${color}.light` },
              boxShadow: 2
            }}
          >
            {icon}
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {value}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Loader>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Loader>
    );
  }

  return (
    <Loader>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Reading Progress
          </Typography>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
              size="small"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<MenuBookIcon />}
              title="Total Books"
              value={stats.totalBooks}
              subtitle="Books finished"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TimerIcon />}
              title="Reading Time"
              value={stats.totalReadingTime}
              subtitle="Total time spent"
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<StarIcon />}
              title="Average Rating"
              value={stats.averageRating}
              subtitle="Out of 5.0"
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUpIcon />}
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              subtitle="Books finished vs started"
              color="success"
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Reading Activity Chart - Enhanced */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              height: 400, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Daily Reading Activity
                </Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveLine
                    data={readingData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    curve="cardinal"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: timeRange === 'year' ? -45 : 0,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'hours',
                      legendOffset: -45,
                      legendPosition: 'middle'
                    }}
                    colors={['#667eea']}
                    pointSize={6}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableArea={true}
                    areaOpacity={0.15}
                    enableGridX={false}
                    enableGridY={true}
                    useMesh={true}
                    tooltip={({ point }) => (
                      <div style={{ 
                        background: 'white', 
                        padding: '9px 12px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        <strong>{point.data.x}</strong><br/>
                        Reading: {point.data.y}h
                      </div>
                    )}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Distribution Chart */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: 400, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Books by Category
                </Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsivePie
                    data={categoryData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: 'category10' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    enableArcLinkLabels={false}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    tooltip={({ datum }) => (
                      <div style={{ 
                        background: 'white', 
                        padding: '9px 12px', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        <strong>{datum.id}</strong><br/>
                        {datum.value} book{datum.value !== 1 ? 's' : ''}
                      </div>
                    )}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Loader>
  );
}
