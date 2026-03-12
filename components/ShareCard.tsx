// components/ShareCard.tsx

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Workout } from "../constants/workoutData";
import { useResponsive } from "../hooks/useResponsive";

const themeColor = "#5a4fcf";

const sportIcons: Record<string, { name: string; library: string }> = {
  "Musculação ": { name: "barbell", library: "Ionicons" },
  "Natação ": { name: "swim", library: "MaterialCommunityIcons" },
  "Vôlei de Quadra ": { name: "volleyball", library: "MaterialCommunityIcons" },
  "Vôlei de Praia ": { name: "sunny", library: "Ionicons" },
  "Futebol Society ": { name: "football", library: "Ionicons" },
  "Boxe ": { name: "boxing-glove", library: "MaterialCommunityIcons" },
};

type Activity = {
  category: string;
  details: {
    type?: string;
    duration?: number;
    distance?: number;
    distanceKm?: number;
    pace?: string;
  };
};

type ShareCardProps = {
  activities: Activity[];
  totalKcal: number;
  totalDuration: number;
  date: Date;
  workouts: Record<string, Workout>;
};

const ShareCard = forwardRef<View, ShareCardProps>(
  ({ activities, totalKcal, totalDuration, date, workouts }, ref) => {
    const { width, fontSize, spacing, isTablet, isLandscape } = useResponsive();

    // Dimensões dinâmicas para o card
    const cardWidth = Math.min(width - spacing.lg * 2, isTablet ? 500 : 350);
    const cardHeight = isLandscape ? 300 : 500;

    const formattedDate = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const formatDurationString = (totalMinutes: number): string => {
      if (totalMinutes <= 0) {
        return "0min";
      }
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      }
      if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}min`;
    };

    const durationString = formatDurationString(totalDuration);

    const backgroundImageUri =
      "https://img.freepik.com/vetores-gratis/padrao-de-estilo-de-vida-saudavel-e-fitness_24877-56485.jpg?semt=ais_hybrid&w=740&q=80";

    return (
      <View ref={ref}>
        <ImageBackground
          source={{ uri: backgroundImageUri }}
          style={[styles.card, { width: cardWidth, height: cardHeight }]}
          imageStyle={{ borderRadius: 15 }}
        >
          <View style={[styles.overlay, { padding: spacing.lg }]}>
            <Text style={[styles.appName, { fontSize: fontSize["2xl"] }]}>
              GymFlow{" "}
            </Text>
            <Text style={[styles.date, { fontSize: fontSize.sm }]}>
              {formattedDate}{" "}
            </Text>

            <View style={styles.activitiesContainer}>
              {activities.map((item, index) => {
                const iconInfo = sportIcons[item.category] || {
                  name: "help-circle",
                  library: "Ionicons",
                };
                const IconComponent =
                  iconInfo.library === "MaterialCommunityIcons"
                    ? MaterialCommunityIcons
                    : Ionicons;

                let activityDisplayName = item.category;
                if (
                  item.category === "Musculação" &&
                  item.details.type &&
                  workouts[item.details.type]
                ) {
                  activityDisplayName = `Academia - ${workouts[item.details.type].name}`;
                }

                // ALTERADO: Formata a duração de cada atividade individual
                const durationInMinutes =
                  item.details.duration ||
                  (item.category === "Musculação" ? 60 : 0);
                const formattedDuration =
                  formatDurationString(durationInMinutes);

                const isSwimmingWithDistance =
                  item.category.toLowerCase() === "natação" &&
                  item.details.distance &&
                  item.details.distance > 0;
                const normalizedCategory = (item.category || "")
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                const isRunningOrCycling =
                  normalizedCategory.includes("corrida") ||
                  normalizedCategory.includes("ciclismo") ||
                  normalizedCategory.includes("bike") ||
                  normalizedCategory.includes("bicicleta");
                const isRunCycleWithDistance =
                  isRunningOrCycling &&
                  !!item.details.distanceKm &&
                  item.details.distanceKm > 0;

                const activityDetailText = isSwimmingWithDistance
                  ? `${item.details.distance}m em ${formattedDuration}${item.details.pace ? ` • ${item.details.pace}` : ""}`
                  : isRunCycleWithDistance
                    ? `${item.details.distanceKm} km${item.details.pace ? ` • ${item.details.pace}` : ""}${formattedDuration ? ` • ${formattedDuration}` : ""}`
                    : formattedDuration;

                return (
                  <View key={index} style={styles.activityRow}>
                    <IconComponent
                      name={iconInfo.name as any}
                      size={20}
                      color="#fff"
                    />
                    <View style={styles.activityTextContainer}>
                      <Text
                        style={[
                          styles.activityText,
                          { fontSize: fontSize.base },
                        ]}
                      >
                        {activityDisplayName}{" "}
                      </Text>
                      {/* ALTERADO: Exibe a duração já formatada */}
                      <Text
                        style={[
                          styles.activityDetailText,
                          { fontSize: fontSize.sm },
                        ]}
                      >
                        {activityDetailText}{" "}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            <View style={styles.totalsContainer}>
              <View style={styles.totalItem}>
                <Text
                  style={[styles.totalValue, { fontSize: fontSize["3xl"] }]}
                >
                  {totalKcal}
                </Text>
                <Text style={[styles.totalLabel, { fontSize: fontSize.sm }]}>
                  kcal{" "}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text
                  style={[styles.totalValue, { fontSize: fontSize["3xl"] }]}
                >
                  {durationString}
                </Text>
                <Text style={[styles.totalLabel, { fontSize: fontSize.sm }]}>
                  Duração{" "}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  },
);

ShareCard.displayName = "ShareCard";

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    alignSelf: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 15,
    justifyContent: "space-between",
  },
  appName: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  date: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 4,
  },
  activitiesContainer: {
    alignSelf: "stretch",
    marginVertical: 20,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  activityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    color: "white",
    fontWeight: "500",
  },
  activityDetailText: {
    color: "#ccc",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    width: "100%",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignSelf: "stretch",
    paddingTop: 10,
  },
  totalItem: {
    alignItems: "center",
    flex: 1,
  },
  totalValue: {
    fontWeight: "bold",
    color: "white",
  },
  totalLabel: {
    color: "#ddd",
    marginTop: 2,
  },
});

export default ShareCard;
