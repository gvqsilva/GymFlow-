import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
} from "react-native-svg";

type Point = { x: number; y: number; weight: number; date: string };

export type LoadPoint = { date: string | number; weight: number | string };

type Props = {
  data: LoadPoint[];
  height?: number;
  maxPoints?: number;
  color?: string;
};

const DEFAULT_COLOR = "#5a4fcf";

export function ExerciseLoadChart({
  data,
  height = 220,
  maxPoints = 30,
  color = DEFAULT_COLOR,
}: Props) {
  const { path, areaPath, points, min, max, yLabels, xLabels } = useMemo(() => {
    try {
      console.log("📊 [Chart] Dados recebidos:", data);
      console.log("📊 [Chart] Quantidade:", data?.length || 0, "pontos");

      const cleaned = (data || [])
        .filter((p) => {
          console.log("🔍 [Chart] Validando ponto:", p);
          const hasDate = p && p.date !== undefined && p.date !== null;

          // Aceitar weight como number ou string
          let weightNum = 0;
          if (typeof p.weight === "number") {
            weightNum = p.weight;
          } else if (typeof p.weight === "string") {
            weightNum = parseFloat(p.weight.replace(",", "."));
          }

          const hasWeight = !isNaN(weightNum) && weightNum > 0;

          console.log("  -> date:", p?.date, "válido?", hasDate);
          console.log(
            "  -> weight:",
            p?.weight,
            "->",
            weightNum,
            "válido?",
            hasWeight,
          );

          const isValid = hasDate && hasWeight;
          if (!isValid) {
            console.warn(
              "📊 [Chart] ❌ Ponto inválido filtrado:",
              p,
              "hasDate:",
              hasDate,
              "hasWeight:",
              hasWeight,
            );
          } else {
            console.log("📊 [Chart] ✅ Ponto válido");
          }
          return isValid;
        })
        .map((p) => ({
          date: p.date,
          weight:
            typeof p.weight === "number"
              ? p.weight
              : parseFloat(String(p.weight).replace(",", ".")),
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      console.log("📊 [Chart] Dados limpos:", cleaned.length, "pontos válidos");
      console.log("📊 [Chart] Dados limpos detalhados:", cleaned);

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
        console.log("📊 [Chart] Nenhum dado válido - retornando vazio");
        return {
          path: "",
          areaPath: "",
          points: [],
          min: 0,
          max: 0,
          yLabels: [],
          xLabels: [],
        };
      }

      const weights = limited.map((d) => d.weight);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const range = Math.max(maxWeight - minWeight, 2); // mínimo 2kg de range

      console.log("📊 [Chart] Range de peso:", { minWeight, maxWeight, range });

      // Arredondar para valores "bonitos"
      const step = Math.ceil(range / 4);
      const roundedMin = Math.floor(minWeight / step) * step;
      const roundedMax = Math.ceil(maxWeight / step) * step;

      const xFor = (i: number) =>
        paddingLeft + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const yFor = (w: number) =>
        paddingTop +
        innerH -
        ((w - roundedMin) / (roundedMax - roundedMin)) * innerH;

      const pts: Point[] = limited.map((d, i) => ({
        x: xFor(i),
        y: yFor(d.weight),
        weight: d.weight,
        date: formatDateShort(d.date),
      }));

      // Criar linha reta (não curva)
      let dPath = "";
      pts.forEach((p, i) => {
        dPath += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
      });

      // Área preenchida com linhas retas
      const area = pts.length
        ? `M ${pts[0].x} ${paddingTop + innerH} L ${pts[0].x} ${pts[0].y} ` +
          pts
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(" ") +
          ` L ${pts[pts.length - 1].x} ${paddingTop + innerH} Z`
        : "";

      // Labels do eixo Y
      const ySteps = 5;
      const yLabels = Array.from({ length: ySteps }, (_, i) => {
        const value =
          roundedMin + ((roundedMax - roundedMin) * i) / (ySteps - 1);
        const y = yFor(value);
        return { value: Math.round(value), y };
      }).reverse();

      // Labels do eixo X (apenas extremos)
      const xLabels = [];
      if (pts.length > 0) {
        xLabels.push({ date: pts[0].date, x: pts[0].x });
        if (pts.length > 1) {
          xLabels.push({
            date: pts[pts.length - 1].date,
            x: pts[pts.length - 1].x,
          });
        }
      }

      console.log("📊 [Chart] Processamento concluído:", {
        pontos: pts.length,
        path: path.length > 0 ? "ok" : "vazio",
        area: area.length > 0 ? "ok" : "vazio",
      });

      return {
        path: dPath,
        areaPath: area,
        points: pts,
        min: minWeight,
        max: maxWeight,
        yLabels,
        xLabels,
      };
    } catch (error) {
      console.error("📊 [Chart] Erro no processamento:", error);
      return {
        path: "",
        areaPath: "",
        points: [],
        min: 0,
        max: 0,
        yLabels: [],
        xLabels: [],
      };
    }
  }, [data, height, maxPoints]);

  const personalRecord = useMemo(() => {
    try {
      const weights = points.map((p) => p.weight);
      if (weights.length === 0) return null;
      const max = Math.max(...weights);
      console.log("🏆 [Chart] PR calculado:", max, "kg");
      return max;
    } catch (e) {
      console.warn("⚠️ [Chart] Erro ao calcular PR:", e);
      return null;
    }
  }, [points]);

  // Calcular informações de evolução
  const evolutionInfo = useMemo(() => {
    if (points.length < 2) return null;
    const firstWeight = points[0].weight;
    const lastWeight = points[points.length - 1].weight;
    const diff = lastWeight - firstWeight;
    const percentChange = ((diff / firstWeight) * 100).toFixed(1);
    return { firstWeight, lastWeight, diff, percentChange, isUp: diff > 0 };
  }, [points]);

  // Fallback se não há dados
  if (points.length === 0) {
    console.log("📊 [Chart] Nenhum ponto para renderizar");
    return (
      <View style={styles.container}>
        <Text style={styles.chartTitle}>Evolução de Carga</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>📊 Nenhum dado disponível</Text>
          <Text style={styles.noDataSubtext}>
            Registre pesos para ver a evolução
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>📈 Evolução de Carga</Text>

      {/* Info cards */}
      {evolutionInfo && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Início</Text>
            <Text style={styles.statValue}>
              {evolutionInfo.firstWeight.toFixed(1)} kg
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: evolutionInfo.isUp ? "#e8f5e9" : "#ffebee" },
            ]}
          >
            <Text style={styles.statLabel}>Mudança</Text>
            <Text
              style={[
                styles.statValue,
                { color: evolutionInfo.isUp ? "#4caf50" : "#f44336" },
              ]}
            >
              {evolutionInfo.isUp ? "+" : ""}
              {evolutionInfo.diff.toFixed(1)} kg ({evolutionInfo.percentChange}
              %)
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Atual</Text>
            <Text style={styles.statValue}>
              {evolutionInfo.lastWeight.toFixed(1)} kg
            </Text>
          </View>
        </View>
      )}

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
          {areaPath ? <Path d={areaPath} fill="url(#fillGradient)" /> : null}

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

          {/* Point markers com labels */}
          {points.map((point, i) => {
            const isFirst = i === 0;
            const isLast = i === points.length - 1;
            const isMax =
              point.weight === Math.max(...points.map((p) => p.weight));

            return (
              <React.Fragment key={i}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={isMax ? 7 : 5}
                  fill={isMax ? "#ff9800" : color}
                  stroke="#ffffff"
                  strokeWidth={isMax ? 4 : 3}
                  opacity={isMax ? 1 : 0.9}
                />
                {/* Labels para primeiro e último ponto */}
                {(isFirst || isLast) && (
                  <SvgText
                    x={point.x}
                    y={point.y - 12}
                    fontSize="11"
                    fill={color}
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {point.weight.toFixed(0)}kg
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

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
      {personalRecord !== null && (
        <View style={styles.prSection}>
          <Text style={styles.prText}>
            🏆 Recorde Pessoal: {personalRecord.toFixed(0)} kg
          </Text>
          <Text style={styles.prSubtext}>
            {points.length} registros · Evoluindo desde {points[0]?.date}
          </Text>
        </View>
      )}

      {/* Legenda simples */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Pontos com peso registrado</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: "#ff9800",
                borderWidth: 2,
                borderColor: "#fff",
              },
            ]}
          />
          <Text style={styles.legendText}>Recorde pessoal do período</Text>
        </View>
      </View>
    </View>
  );
}

function formatDate(date: string | number): string {
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5a4fcf",
  },
  chartWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  prSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f0efff",
    borderRadius: 8,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#5a4fcf",
  },
  prText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5a4fcf",
  },
  prSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  legendContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  legend: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  legendRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "700",
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginVertical: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});

export default ExerciseLoadChart;
