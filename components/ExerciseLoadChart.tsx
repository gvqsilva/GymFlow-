import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

type Point = { x: number; y: number; weight: number; date: string };

export type LoadPoint = { date: string | number; weight: number };

type Props = {
  data: LoadPoint[];
  height?: number;
  maxPoints?: number;
  color?: string;
};

const DEFAULT_COLOR = '#5a4fcf';

export function ExerciseLoadChart({ data, height = 180, maxPoints = 30, color = DEFAULT_COLOR }: Props) {
  const { path, areaPath, points, min, max, yLabels, xLabels } = useMemo(() => {
    const cleaned = (data || [])
      .filter(p => typeof p.weight === 'number' && !isNaN(p.weight))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const limited = cleaned.slice(-maxPoints);
    const n = limited.length;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 35;
    const width = 280;
    const innerW = width - paddingLeft - paddingRight;
    const innerH = height - paddingTop - paddingBottom;

    if (n === 0) {
      return { path: '', areaPath: '', points: [], min: 0, max: 0, yLabels: [], xLabels: [] };
    }

    const weights = limited.map(d => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = Math.max(maxWeight - minWeight, 2); // mínimo 2kg de range
    
    // Arredondar para valores "bonitos"
    const step = Math.ceil(range / 4);
    const roundedMin = Math.floor(minWeight / step) * step;
    const roundedMax = Math.ceil(maxWeight / step) * step;

    const xFor = (i: number) => paddingLeft + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yFor = (w: number) => paddingTop + innerH - ((w - roundedMin) / (roundedMax - roundedMin)) * innerH;

    const pts: Point[] = limited.map((d, i) => ({ 
      x: xFor(i), 
      y: yFor(d.weight),
      weight: d.weight,
      date: formatDateShort(d.date)
    }));

    // Criar linha reta (não curva)
    let dPath = '';
    pts.forEach((p, i) => {
      dPath += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
    });

    // Área preenchida com linhas retas
    const area = pts.length
      ? `M ${pts[0].x} ${paddingTop + innerH} L ${pts[0].x} ${pts[0].y} ` +
        pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${pts[pts.length - 1].x} ${paddingTop + innerH} Z`
      : '';

    // Labels do eixo Y
    const ySteps = 5;
    const yLabels = Array.from({ length: ySteps }, (_, i) => {
      const value = roundedMin + ((roundedMax - roundedMin) * i) / (ySteps - 1);
      const y = yFor(value);
      return { value: Math.round(value), y };
    }).reverse();

    // Labels do eixo X (apenas extremos)
    const xLabels = [];
    if (pts.length > 0) {
      xLabels.push({ date: pts[0].date, x: pts[0].x });
      if (pts.length > 1) {
        xLabels.push({ date: pts[pts.length - 1].date, x: pts[pts.length - 1].x });
      }
    }

    return { path: dPath, areaPath: area, points: pts, min: minWeight, max: maxWeight, yLabels, xLabels };
  }, [data, height, maxPoints]);

  const personalRecord = Math.max(...(points.map(p => p.weight) || [0]));

  return (
    <View style={styles.container}> 
      <Text style={styles.chartTitle}>Evolução de Carga</Text>
      
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
          <Defs>
            <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>

          {/* Grid horizontal lines */}
          {yLabels.map((label, i) => (
            <Line 
              key={i}
              x1={45} 
              y1={label.y} 
              x2={265} 
              y2={label.y} 
              stroke="#ddd" 
              strokeWidth={0.8}
              strokeDasharray="3,3"
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <SvgText
              key={i}
              x={40}
              y={label.y + 4}
              fontSize="12"
              fill="#888"
              textAnchor="end"
            >
              {label.value}kg
            </SvgText>
          ))}

          {/* Area fill */}
          {areaPath ? (
            <Path d={areaPath} fill="url(#fillGradient)" />
          ) : null}

          {/* Main line */}
          {path ? (
            <Path 
              d={path} 
              stroke={color} 
              strokeWidth={3} 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          ) : null}

          {/* Point markers */}
          {points.map((point, i) => (
            <Circle 
              key={i} 
              cx={point.x} 
              cy={point.y} 
              r={5} 
              fill={color} 
              stroke="#ffffff" 
              strokeWidth={3} 
            />
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <SvgText
              key={i}
              x={label.x}
              y={height - 8}
              fontSize="12"
              fill="#888"
              textAnchor="middle"
            >
              {label.date}
            </SvgText>
          ))}
        </Svg>
      </View>
      
      {/* PR Section */}
      <View style={styles.prSection}>
        <Text style={styles.prText}>Recorde Pessoal (PR): {personalRecord.toFixed(0)} kg</Text>
      </View>
    </View>
  );
}

function formatDate(date: string | number): string {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return String(date);
  }
}

function formatDateShort(date: string | number): string {
  try {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return String(date);
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16
  },
  chartWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8
  },
  prSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0efff',
    borderRadius: 8,
    alignItems: 'center'
  },
  prText: {
    fontSize: 16,
    fontWeight: '700',
    color: DEFAULT_COLOR
  },
  legend: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  legendLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600'
  },
  legendValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700'
  }
});

export default ExerciseLoadChart;
