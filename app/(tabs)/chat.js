import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMatches } from "../../services/matchService";

// 🔹 Función auxiliar para obtener un usuario por su ID
const getUserById = async (id) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const res = await axios.get(`https://turumiapi.onrender.com/user/${id}`, {
      headers: { accesstoken: token },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error(`❌ Error obteniendo usuario ${id}:`, err.response?.data || err.message);
    return null;
  }
};

export default function Chat() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      // 🔹 Obtener matches desde el service
      const data = await getMatches();
      const allMatches = Array.isArray(data.matches) ? data.matches : [];
      console.log("test" ,data);

      // 🔹 Filtramos solo los "matched"
      const confirmed = allMatches.filter((m) => m.match_status === "matched");

      // 🔹 Identificar usuario actual (para saber cuál es el "otro")
      const currentUser = await AsyncStorage.getItem("user");
      const currentId = currentUser ? JSON.parse(currentUser).id_user : null;

      // 🔹 Enriquecer con el usuario destino (to_id_user)
      const enriched = await Promise.all(
        confirmed.map(async (m) => {
          const otherUserId =
            m.from_id_user === currentId ? m.to_id_user : m.from_id_user;

          const user = await getUserById(otherUserId);
          return { ...m, to_user: user };
        })
      );

      setMatches(enriched);
    } catch (err) {
      console.error("❌ Error cargando matches:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={{ marginTop: 10 }}>Cargando matches...</Text>
      </View>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aún no tienes matches 😅</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Text style={styles.name}>
              {item.to_user?.name || "Usuario desconocido"}
            </Text>
            <Text style={styles.status}>
              Estado: {item.match_status || "Sin estado"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  matchCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  status: { color: "#4B5563", marginTop: 4 },
  emptyText: { color: "#6B7280", fontSize: 16 },
});
