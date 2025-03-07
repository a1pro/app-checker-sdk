import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  AppState,
  StyleSheet,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import { NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';
import { Base_Url } from '../apiEndpint/ApiEndpoint';

const { InstalledAppsModule } = NativeModules;

// Define device details type
interface DeviceDetails {
  deviceId: string;
  deviceModel: string;
  deviceName: string;
  deviceOs: string;
}

const Home: React.FC = () => {
  const [userDeviceDetails, setUserDeviceDetails] = useState<DeviceDetails>({
    deviceId: '',
    deviceModel: '',
    deviceName: '',
    deviceOs: '',
  });

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [similarApps, setSimilarApps] = useState<string[]>([]);
  const [lastCloseDate, setLastCloseDate] = useState<string>('');

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        const currentDate = new Date().toISOString();
        try {
        //   await AsyncStorage.setItem('lastCloseDate', currentDate);
          setLastCloseDate(currentDate);
        } catch (error) {
          console.error('Error saving last close date:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const fetchInstalledApps = async () => {
    try {
      if (InstalledAppsModule?.getInstalledApps) {
        const apps: string[] = await InstalledAppsModule.getInstalledApps();
        setInstalledApps(apps.map((app) => app.trim().toLowerCase()));
      } else {
        console.warn('InstalledAppsModule is not available.');
      }
    } catch (error) {
      console.error('Error fetching installed apps:', error);
    }
  };

  const getAppNames = async () => {
    try {
      const res = await axios.post(
        Base_Url.appnames,
        { operatorId: '0001' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success) {
        const packageNames: string[] = res.data.data.map((item: { app_name: string }) =>
          item.app_name.trim().toLowerCase()
        );

        const fuse = new Fuse(packageNames, { includeScore: true, threshold: 0.3 });

        const matchedApps = installedApps.filter(
          (installedApp) => fuse.search(installedApp).length > 0
        );

        setSimilarApps(matchedApps);
      }
    } catch (error) {
      console.log('Error fetching app names:', error);
    }
  };

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const deviceId = await DeviceInfo.getUniqueId();
        const deviceName = await DeviceInfo.getDeviceName();
        const deviceModel = await DeviceInfo.getModel();
        const deviceOs = await DeviceInfo.getSystemName();

        setUserDeviceDetails({ deviceId, deviceName, deviceModel, deviceOs });

        // const lastClose = (await AsyncStorage.getItem('lastCloseDate')) || '';
        // setLastCloseDate(lastClose);
      } catch (error) {
        console.error('Error getting device information:', error);
      }
    };

    const getStoredData = async () => {
      try {
        // const storedToken = await AsyncStorage.getItem('token');
        // const storedUserId = await AsyncStorage.getItem('userId');
        // setToken(storedToken);
        // setUserId(storedUserId);
      } catch (error) {
        console.error('Error retrieving token/userId:', error);
      }
    };

    getUserInfo();
    getStoredData();
  }, []);

  useEffect(() => {
    const checkApps = async () => {
      await fetchInstalledApps();
      await getAppNames();
    };
    checkApps();
  }, []);

  useEffect(() => {
    if (similarApps.length > 0) {
      Alert.alert(`You have already installed similar app(s): ${similarApps.join(', ')}`);
      setTimeout(() => sendUserDetails(), 3000);
    } else {
      Alert.alert('No Similar Apps Found');
    }
  }, [similarApps]);

  const sendUserDetails = async () => {
    if (!userDeviceDetails.deviceId || !token || !userId) {
      console.warn('Missing required details');
      return;
    }

    try {
      const res = await axios.post(
        Base_Url.appdetect,
        {
          deviceId: userDeviceDetails.deviceId,
          deviceModel: userDeviceDetails.deviceModel,
          deviceName: userDeviceDetails.deviceName,
          deviceOs: userDeviceDetails.deviceOs,
          user_id: userId,
          app_closedate: lastCloseDate,
          operatorId: '0001',
          app_name: similarApps,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.code === 200) {
        Alert.alert('Success', res.data.message);
        console.log('Success:', res.data.message);
      }
    } catch (error) {
      console.log('Error sending user details:', error);
    }
  };

  const handleLogout = async () => {
    try {
    //   await AsyncStorage.removeItem('token');
      Alert.alert('Logout Successfully');
      // navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>My Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: { fontSize: 24, fontWeight: 'bold' },
  logoutText: { fontSize: 18, color: 'red' },
});

export default Home;
