import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text, translateText, useAppLanguage } from '../i18n';

const STEPS = ['Chuyến bay', 'Hành khách', 'Thanh toán', 'Hoàn tất'];

export function BookingProgress({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const language = useAppLanguage();
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const stepLabels = STEPS.map((step) => translateText(step, language));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={language === 'vi'
        ? `Tiến trình đặt vé: bước ${currentStep} trên ${STEPS.length}, ${STEPS[currentStep - 1]}`
        : `Booking progress: step ${currentStep} of ${STEPS.length}, ${stepLabels[currentStep - 1]}`}
      accessibilityValue={{ min: 1, max: STEPS.length, now: currentStep }}
      style={styles.container}
    >
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress}%` }]} />
      </View>
      {stepLabels.map((label, index) => {
        const step = index + 1;
        const complete = step < currentStep;
        const active = step === currentStep;

        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                styles.circle,
                (complete || active) && styles.circleCurrent,
              ]}
            >
              <Text
                style={[
                  styles.number,
                  (complete || active) && styles.numberCurrent,
                ]}
              >
                {complete ? '✓' : `0${step}`}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.label, active && styles.labelCurrent]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 18,
  },
  track: {
    position: 'absolute',
    top: 21,
    left: '12.5%',
    right: '12.5%',
    height: 2,
    backgroundColor: '#DCE7F0',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#2878B9',
  },
  step: {
    width: '25%',
    alignItems: 'center',
    gap: 7,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    borderColor: '#2878B9',
    backgroundColor: '#2878B9',
  },
  number: {
    color: '#687F91',
    fontSize: 11,
    fontWeight: '700',
  },
  numberCurrent: {
    color: '#FFFFFF',
  },
  label: {
    color: '#687F91',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelCurrent: {
    color: '#123B5D',
    fontWeight: '800',
  },
});
