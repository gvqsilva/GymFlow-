// components/TodaysPlanCard.tsx

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useWeeklyPlan } from "../hooks/useWeeklyPlan";

const themeColor = "#5a4fcf";

const PERIOD_INFO = {
  manha: { label: "🌅 Manhã", color: "#FFB84D", bgColor: "#fff9e8" },
  tarde: { label: "🌤️ Tarde", color: "#FF9F43", bgColor: "#ffe8d4" },
  noite: { label: "🌙 Noite", color: "#4A90E2", bgColor: "#e8f0ff" },
};

export function TodaysPlanCard() {
  const { todayWeeklyPlan } = useWeeklyPlan();

  if (!todayWeeklyPlan) {
    return null;
  }

  // Formatar data de hoje com dia da semana
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const formattedDate = today.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
  const dateDisplay = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, ${formattedDate}`;

  // Determinar período atual
  const hour = today.getHours();
  let currentPeriod: "manha" | "tarde" | "noite";
  if (hour >= 5 && hour < 12) {
    currentPeriod = "manha";
  } else if (hour >= 12 && hour < 18) {
    currentPeriod = "tarde";
  } else {
    currentPeriod = "noite";
  }

  const totalActivities =
    (todayWeeklyPlan.periods.manha?.length || 0) +
    (todayWeeklyPlan.periods.tarde?.length || 0) +
    (todayWeeklyPlan.periods.noite?.length || 0);

  const hasActivities = totalActivities > 0;

  const renderPeriod = (periodKey: "manha" | "tarde" | "noite") => {
    const activities = todayWeeklyPlan.periods[periodKey] || [];
    const periodInfo = PERIOD_INFO[periodKey];

    return (
      <View
        key={periodKey}
        style={[styles.periodCard, { backgroundColor: periodInfo.bgColor }]}
      >
        <View style={styles.periodTitle}>
          <View
            style={[
              styles.periodColorDot,
              { backgroundColor: periodInfo.color },
            ]}
          />
          <Text style={styles.periodLabel}>{periodInfo.label}</Text>
          <View
            style={[styles.periodBadge, { backgroundColor: periodInfo.color }]}
          >
            <Text style={styles.periodBadgeText}>{activities.length}</Text>
          </View>
        </View>

        {activities.length > 0 ? (
          <View style={styles.activitiesList}>
            {activities.map((activity, index) => (
              <View
                key={`${activity.id}-${index}`}
                style={styles.activityWrapper}
              >
                <View style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIndicator,
                      { backgroundColor: periodInfo.color },
                    ]}
                  />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityName} numberOfLines={1}>
                      {activity.name}
                    </Text>
                    {activity.notes && (
                      <Text style={styles.activityNotes} numberOfLines={1}>
                        ✏️ {activity.notes}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyPeriodText}>Nenhuma atividade</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com gradiente */}
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Plano de Hoje</Text>
            <Text style={styles.headerSubtitle}>{dateDisplay}</Text>
          </View>
        </View>
        <View
          style={[
            styles.activityCount,
            {
              backgroundColor: hasActivities
                ? "rgba(255,255,255,0.3)"
                : "rgba(0,0,0,0.2)",
            },
          ]}
        >
          <Text style={styles.activityCountText}>{totalActivities}</Text>
        </View>
      </View>

      {/* Timeline dos Períodos */}
      <View style={styles.timelineContainer}>
        {(["manha", "tarde", "noite"] as const).map((period, index) => {
          const isActive = period === currentPeriod;
          const activitiesCount = todayWeeklyPlan.periods[period]?.length || 0;
          const periodInfo = PERIOD_INFO[period];

          return (
            <View key={period} style={styles.timelineItemWrapper}>
              <View
                style={[
                  styles.timelineItem,
                  isActive && { backgroundColor: periodInfo.color },
                  !isActive && { backgroundColor: "#e8e8e8" },
                ]}
              >
                <Text
                  style={[
                    styles.timelinePeriodEmoji,
                    { color: isActive ? "white" : periodInfo.color },
                  ]}
                >
                  {periodInfo.label.split(" ")[0]}
                </Text>
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  isActive && { color: periodInfo.color },
                ]}
              >
                {activitiesCount}{" "}
                {activitiesCount === 1 ? "atividade" : "atividades"}
              </Text>

              {/* Conector */}
              {index < 2 && (
                <View
                  style={[
                    styles.timelineConnector,
                    period === currentPeriod ||
                    todayWeeklyPlan.periods[period]?.length
                      ? { backgroundColor: periodInfo.color }
                      : {},
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Badge "Agora" */}
      <View style={styles.nowBadgeContainer}>
        <View
          style={[
            styles.nowBadge,
            { backgroundColor: PERIOD_INFO[currentPeriod].color },
          ]}
        >
          <Ionicons name="ellipse" size={8} color="white" />
          <Text style={styles.nowBadgeText}>Agora</Text>
        </View>
      </View>

      {hasActivities ? (
        <View style={styles.periodsContainer}>
          {renderPeriod("manha")}
          {renderPeriod("tarde")}
          {renderPeriod("noite")}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons
              name="calendar-clear-outline"
              size={56}
              color={themeColor}
            />
          </View>
          <Text style={styles.emptyStateText}>Nenhuma atividade planejada</Text>
          <Text style={styles.emptyStateSubtext}>
            Configure um plano na aba Configurações
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  activityCount: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  activityCountText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  // Períodos
  periodsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  periodCard: {
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColor,
  },
  periodTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  periodColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  periodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  periodBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  // Atividades
  activitiesList: {
    gap: 8,
  },
  activityWrapper: {
    marginBottom: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 8,
  },
  activityIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 10,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  activityNotes: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  emptyPeriodText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },

  // Empty State
  emptyStateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(90, 79, 207, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },

  // Timeline
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  timelineItemWrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    position: "relative",
    height: 80,
  },
  timelineItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelinePeriodEmoji: {
    fontSize: 22,
    fontWeight: "700",
  },
  timelineLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  timelineConnector: {
    height: 3,
    flex: 1,
    backgroundColor: "#e8e8e8",
    marginHorizontal: -6,
    zIndex: -1,
  },

  // Badge "Agora"
  nowBadgeContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f8f8f8",
  },
  nowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  nowBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
});
