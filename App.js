import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

const musicTracks = [
  {
    id: "1",
    title: "Longing",
    artist: "Bensound",
    audioUri: require("./assets/bensound-longing.mp3"),
    imageUri:
      "https://images.pexels.com/photos/3016757/pexels-photo-3016757.jpeg",
  },
  {
    id: "2",
    title: "Acoustic Breeze",
    artist: "Bensound",
    audioUri: require("./assets/bensound-pulseoftime.mp3"),
    imageUri:
      "https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg",
  },
  // Add more tracks as needed
];

export default function App() {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const flatListRef = useRef();

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  async function playSound() {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      musicTracks[currentTrackIndex].audioUri
    );
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);
  }

  async function pauseSound() {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    if (sound) {
      const interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        setPosition(status.positionMillis);
        setDuration(status.durationMillis);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sound]);

  async function playNextTrack() {
    const nextIndex = (currentTrackIndex + 1) % musicTracks.length;
    setCurrentTrackIndex(nextIndex);
    flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
    if (isPlaying) {
      await pauseSound();
      await playSound();
    }
  }

  async function playPreviousTrack() {
    const previousIndex =
      (currentTrackIndex - 1 + musicTracks.length) % musicTracks.length;
    setCurrentTrackIndex(previousIndex);
    flatListRef.current.scrollToIndex({ index: previousIndex, animated: true });
    if (isPlaying) {
      await pauseSound();
      await playSound();
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image style={styles.albumImage} source={{ uri: item.imageUri }} />
    </View>
  );

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Hassanfy</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={musicTracks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          if (newIndex !== currentTrackIndex) {
            setCurrentTrackIndex(newIndex);
            if (isPlaying) {
              pauseSound().then(playSound);
            }
          }
        }}
      />

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>
          {musicTracks[currentTrackIndex].title}
        </Text>
        <Text style={styles.artistName}>
          {musicTracks[currentTrackIndex].artist}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#777"
          thumbTintColor="#1DB954"
          onSlidingComplete={async (value) => {
            if (sound) {
              await sound.setPositionAsync(value);
            }
          }}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={playPreviousTrack}>
          <Ionicons name="play-skip-back" size={32} color="#1DB954" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? pauseSound : playSound}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={playNextTrack}>
          <Ionicons name="play-skip-forward" size={32} color="#1DB954" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#191414",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  slide: {
    width: width,
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  albumImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
  },
  trackInfo: {
    alignItems: "center",
    marginTop: 20,
  },
  trackTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  artistName: {
    color: "#B3B3B3",
    fontSize: 18,
  },
  progressContainer: {
    width: "90%",
    marginTop: 20,
  },
  progressBar: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "#B3B3B3",
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    marginBottom: 40,
  },
  playButton: {
    backgroundColor: "#1DB954",
    padding: 20,
    borderRadius: 50,
    marginHorizontal: 30,
  },
});
