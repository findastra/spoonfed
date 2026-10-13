import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Bookmark, Check, ChevronDown, Compass, Heart, Info, Leaf, LockKeyhole, MapPin, Navigation, RotateCcw, Search, Shuffle, SlidersHorizontal, Smartphone, Sparkles, ThumbsUp, UnlockKeyhole, Utensils, Wallet, X } from 'lucide-react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { RESTAURANTS, Restaurant, neighborhoods, cuisines, prices } from './src/data/restaurants';
import { filterRestaurants, pickRestaurant } from './src/lib/discovery';

const C = { bg: '#F9F7F1', white: '#FFFFFF', ink: '#282A23', muted: '#6F7264', orange: '#C94421', light: '#FCEAE1', line: '#E8E7DE', green: '#557354', pale: '#EFF2E9' };
type Tab = 'discover' | 'explore' | 'saved';
type Reel = 'neighborhood' | 'cuisine' | 'price';
type Choices = { neighborhood: string | null; cuisine: string | null; price: number | null };
const EMPTY: Choices = { neighborhood: null, cuisine: null, price: null };
const SAVE_KEY = 'spoonfed:saved:v1';
const priceText = (value: number) => '$'.repeat(value);
const label = (key: Reel, value: string | number | null) => value === null ? ({ neighborhood: 'Anywhere', cuisine: 'Anything', price: 'Any budget' }[key]) : key === 'price' ? priceText(Number(value)) : String(value);
const options: Record<Reel, readonly (string | number)[]> = { neighborhood: neighborhoods, cuisine: cuisines, price: prices };

function Spoon({ size = 30, color = C.orange }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32"><Ellipse cx="21" cy="9" rx="6.5" ry="9" rotation="37" origin="21,9" fill={color} /><Path d="M17 15 L6 29" stroke={color} strokeWidth="5" strokeLinecap="round" /></Svg>;
}
function T({ children, style, ...props }: React.ComponentProps<typeof Text>) { return <Text {...props} style={[s.text, style]}>{children}</Text>; }
function Chip({ children, active, onPress, icon }: { children: React.ReactNode; active?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={({ pressed }) => [s.chip, active && s.chipActive, pressed && s.pressed]}>{icon}<T style={[s.chipText, active && { color: C.orange }]}>{children}</T></Pressable>;
}
function Action({ children, onPress, secondary, disabled, icon }: { children: React.ReactNode; onPress: () => void; secondary?: boolean; disabled?: boolean; icon?: React.ReactNode }) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled: !!disabled }} onPress={onPress} style={({ pressed }) => [s.action, secondary && s.secondary, disabled && { opacity: .6 }, pressed && s.pressed]}>{icon}<T style={[s.actionText, secondary && { color: C.ink }]}>{children}</T></Pressable>;
}

type SaveButtonProps = { restaurant: Restaurant; isSaved: boolean; storageReady: boolean; onSave: (restaurant: Restaurant) => void; overlay?: boolean };
function SaveButton({ restaurant, isSaved, storageReady, onSave, overlay = false }: SaveButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved ? 'Unsave' : 'Save'} ${restaurant.name}`} accessibilityState={{ selected: isSaved, disabled: !storageReady }} disabled={!storageReady} onPress={() => onSave(restaurant)} style={[s.saveButton, overlay && s.saveOverlay]}><Bookmark size={19} color={isSaved ? C.orange : C.ink} fill={isSaved ? C.orange : 'transparent'} /></Pressable>;
}
function RestaurantCard({ restaurant, isSaved, storageReady, onSave, onOpen, wide, small }: SaveButtonProps & { onOpen: (restaurant: Restaurant) => void; wide: boolean; small: boolean }) {
  return <View style={[s.smallCard, { width: wide ? '23.7%' : small ? '100%' : '48.7%' }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${restaurant.name}`} onPress={() => onOpen(restaurant)}><Image source={{ uri: restaurant.image }} style={s.cardImage} accessibilityLabel={`Illustrative ${restaurant.cuisine} food`} /><View style={s.smallCardBody}><View style={s.between}><T style={s.restaurantTitle}>{restaurant.name}</T><View style={s.rating}><ThumbsUp size={12} color={C.green} /><T style={s.ratingText}>{restaurant.likedPercent}%</T></View></View><T style={s.meta}>{restaurant.cuisine} · {priceText(restaurant.price)} · {restaurant.neighborhood}</T><T style={s.cardDish}>{restaurant.dish}</T></View></Pressable>
    <SaveButton restaurant={restaurant} isSaved={isSaved} storageReady={storageReady} onSave={onSave} overlay />
  </View>;
}
function Notice({ message, onDismiss, bottomNav = false, inline = false }: { message: string; onDismiss: () => void; bottomNav?: boolean; inline?: boolean }) {
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.toast, bottomNav && { bottom: 90 }, inline && { position: 'relative', bottom: 0, marginBottom: 18 }]}><T style={s.toastText}>{message}</T><Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={onDismiss}><X size={17} color="white" /></Pressable></View>;
}

export default function App() {
  const [fontsReady, fontError] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, Fraunces_600SemiBold, Fraunces_500Medium });
  if (!fontsReady && !fontError) return <View style={s.loading}><Spoon size={54} /><Text style={{ color: C.ink, marginTop: 18 }}>Setting the table…</Text></View>;
  return <SafeAreaProvider><Spoonfed /></SafeAreaProvider>;
}

function Spoonfed() {
  const { width } = useWindowDimensions();
  const wide = width >= 940;
  const small = width < 600;
  const [tab, setTab] = useState<Tab>('discover');
  const [choices, setChoices] = useState<Choices>(EMPTY);
  const [locks, setLocks] = useState({ neighborhood: false, cuisine: false, price: false });
  const [openNow, setOpenNow] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [picked, setPicked] = useState<Restaurant | null>(RESTAURANTS[0]);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [tick, setTick] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [chooser, setChooser] = useState<Reel | null>(null);
  const [detail, setDetail] = useState<Restaurant | null>(null);
  const [about, setAbout] = useState(false);
  const [locationInfo, setLocationInfo] = useState(false);
  const [search, setSearch] = useState('');
  const [exploreCuisine, setExploreCuisine] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [shakeOn, setShakeOn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const spinBusy = useRef(false);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShake = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const filters = { neighborhood: locks.neighborhood ? choices.neighborhood : null, cuisine: locks.cuisine ? choices.cuisine : null, price: locks.price ? choices.price : null, openNow, vegetarian };
  const matches = filterRestaurants(RESTAURANTS, filters);
  const browsing = filterRestaurants(RESTAURANTS, { neighborhood: null, cuisine: exploreCuisine, price: null, openNow: false, vegetarian: false }, search);
  const savedRestaurants = RESTAURANTS.filter(r => saved.includes(r.id));

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then(raw => {
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed.filter((id): id is string => typeof id === 'string' && RESTAURANTS.some(r => r.id === id)));
      }
    }).catch(() => { setStorageAvailable(false); setNotice('Device storage is unavailable. Saves will last for this session.'); }).finally(() => setStorageReady(true));
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const appState = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => { motion.remove(); appState.remove(); if (spinTimer.current) clearTimeout(spinTimer.current); };
  }, []);
  useEffect(() => {
    if (storageReady && storageAvailable) AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saved)).catch(() => { setStorageAvailable(false); setNotice('Could not save on this device. Your list is kept for this session.'); });
  }, [saved, storageReady, storageAvailable]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); } }, [notice]);
  useEffect(() => { if (spinning && !reduceMotion) { const timer = setInterval(() => setTick(t => t + 1), 90); return () => clearInterval(timer); } }, [spinning, reduceMotion]);

  const feedMe = useCallback(() => {
    if (spinBusy.current || chooser || detail || about || locationInfo) return;
    const next = pickRestaurant(matches, picked?.id);
    if (!next) { setPicked(null); setHasSpun(true); setNotice('No matches. Unlock a choice or turn off a filter to widen the menu.'); return; }
    spinBusy.current = true;
    setSpinning(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    spinTimer.current = setTimeout(() => {
      setChoices(old => ({ neighborhood: locks.neighborhood ? old.neighborhood : next.neighborhood, cuisine: locks.cuisine ? old.cuisine : next.cuisine, price: locks.price ? old.price : next.price }));
      setPicked(next); setHasSpun(true); setSpinning(false); spinBusy.current = false;
      AccessibilityInfo.announceForAccessibility(`Your pick is ${next.name}, ${next.cuisine} in ${next.neighborhood}, ${priceText(next.price)}.`);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, reduceMotion ? 0 : 1050);
  }, [matches, picked, locks, reduceMotion, chooser, detail, about, locationInfo]);
  const feedRef = useRef(feedMe);
  useEffect(() => { feedRef.current = feedMe; }, [feedMe]);
  useEffect(() => {
    if (!shakeOn || tab !== 'discover' || !appActive) return;
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      if (Math.sqrt(x * x + y * y + z * z) > 2.2 && Date.now() - lastShake.current > 2500) { lastShake.current = Date.now(); feedRef.current(); }
    });
    return () => subscription.remove();
  }, [shakeOn, tab, appActive]);

  async function toggleShake() {
    if (shakeOn) { setShakeOn(false); return; }
    try {
      const permission = await Accelerometer.requestPermissionsAsync();
      if (!permission.granted || !(await Accelerometer.isAvailableAsync())) { setNotice('Shake is unavailable here. The Feed me button does the same thing.'); return; }
      setShakeOn(true); setNotice('Shake is on. Give your phone a gentle shake to find a bite.');
    } catch { setNotice('Shake is unavailable here. Use Feed me to spin.'); }
  }
  function changeTab(next: Tab) { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  function save(r: Restaurant) { if (!storageReady) return; setSaved(old => old.includes(r.id) ? old.filter(id => id !== r.id) : [...old, r.id]); }
  function reset() { setChoices(EMPTY); setLocks({ neighborhood: false, cuisine: false, price: false }); setOpenNow(false); setVegetarian(false); setPicked(null); setHasSpun(false); }
  function selectChoice(value: string | number | null) { if (!chooser || spinBusy.current) return; setChoices(old => ({ ...old, [chooser]: value })); setLocks(old => ({ ...old, [chooser]: value !== null })); setPicked(null); setChooser(null); }
  const closeModal = () => { setChooser(null); setDetail(null); setAbout(false); setLocationInfo(false); };
  const modalOpen = !!chooser || !!detail || about || locationInfo;
  const tabs: { key: Tab; text: string; icon: typeof Compass }[] = [{ key: 'discover', text: 'Discover', icon: Shuffle }, { key: 'explore', text: 'Explore', icon: Compass }, { key: 'saved', text: 'Saved', icon: Bookmark }];

  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <StatusBar style="dark" />
    <View style={s.header}><View style={[s.headerInner, small && { paddingHorizontal: 20 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Spoonfed home" onPress={() => changeTab('discover')} style={s.brand}><Spoon size={33} /><T style={s.wordmark}>spoonfed<T style={{ color: C.orange }}>.</T></T></Pressable>
      {wide && <View style={s.nav}>{tabs.map(({ key, text, icon: Icon }) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => changeTab(key)} style={[s.navItem, tab === key && s.navActive]}><Icon size={17} color={tab === key ? C.orange : C.muted} /><T style={[s.navText, tab === key && { color: C.orange }]}>{text}{key === 'saved' && saved.length ? ` (${saved.length})` : ''}</T></Pressable>)}</View>}
      <Pressable accessibilityRole="button" accessibilityLabel="Change location or view demo area" onPress={() => setLocationInfo(true)} style={s.location}><MapPin size={16} color={C.orange} /><T style={s.locationText}>{small ? 'Denver' : 'Denver, CO'}</T><ChevronDown size={14} color={C.muted} /></Pressable>
    </View></View>
    <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={[s.content, small && { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 36 }]} keyboardShouldPersistTaps="handled">
      <View style={s.topline}><View style={s.inline}><View style={s.dot} /><T style={s.eyebrow}>GOOD FOOD. HAPPY ACCIDENTS.</T></View><Pressable accessibilityRole="button" onPress={() => setAbout(true)} style={s.demoBadge}><T style={s.demoText}>FIRST TASTE · DEMO</T><Info size={12} color={C.muted} /></Pressable></View>
      {tab === 'discover' ? <>
        <View style={[s.hero, !wide && { flexDirection: 'column', gap: 28 }]}>
          <View style={[s.heroLeft, !wide && { width: '100%' }]}>
            <T accessibilityRole="header" style={[s.headline, small && { fontSize: 45, lineHeight: 49 }]}>Less scrolling.{"\n"}More <T style={[s.headline, { color: C.orange }, small && { fontSize: 45, lineHeight: 49 }]}>“let’s eat.”</T></T>
            <T style={s.subtitle}>A little nudge toward your next favorite spot.{"\n"}Pick what matters. Leave the rest to us.</T>
            <View style={s.machine}>
              <View style={s.machineHeading}><View style={s.inline}><Sparkles size={17} color={C.orange} /><T style={s.machineTitle}>A good meal is one spin away.</T></View><Pressable accessibilityRole="button" accessibilityLabel="Reset choices and filters" disabled={spinning} onPress={reset} style={s.reset}><RotateCcw size={16} color={C.muted} /></Pressable></View>
              <View style={s.reels}>{(['neighborhood', 'cuisine', 'price'] as Reel[]).map((key, index) => {
                const Icon = [MapPin, Utensils, Wallet][index];
                const vals = options[key];
                const current = spinning && !locks[key] && !reduceMotion ? vals[(tick + index * 3) % vals.length] : choices[key];
                const position = Math.max(0, vals.indexOf(current as never));
                return <View key={key} style={[s.reel, index !== 2 && s.reelBorder]}>
                  <View style={s.reelLabel}><Icon size={13} color={C.muted} /><T style={s.reelLabelText}>{['AREA', 'CUISINE', 'PRICE'][index]}</T></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${key}: ${label(key, choices[key])}`} disabled={spinning} onPress={() => setChooser(key)} style={s.reelWindow}>
                    <T numberOfLines={1} style={s.reelGhost}>{label(key, vals[(position + vals.length - 1) % vals.length])}</T>
                    <View style={[s.reelChoice, locks[key] && { backgroundColor: C.light }]}><T numberOfLines={1} adjustsFontSizeToFit style={[s.reelValue, small && { fontSize: 16 }, locks[key] && { color: C.orange }]}>{label(key, current)}</T><ChevronDown size={12} color={locks[key] ? C.orange : C.muted} /></View>
                    <T numberOfLines={1} style={s.reelGhost}>{label(key, vals[(position + 1) % vals.length])}</T>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${locks[key] ? 'Unlock' : 'Lock'} ${key}`} accessibilityState={{ selected: locks[key], disabled: spinning }} disabled={spinning} onPress={() => { if (choices[key] === null) setChooser(key); else { setLocks(old => ({ ...old, [key]: !old[key] })); setPicked(null); } }} style={[s.lockButton, locks[key] && s.lockActive]}>{locks[key] ? <LockKeyhole size={13} color={C.orange} /> : <UnlockKeyhole size={13} color={C.muted} />}<T style={[s.lockText, locks[key] && { color: C.orange }]}>{locks[key] ? 'Locked' : 'Lock'}</T></Pressable>
                </View>;
              })}</View>
              <View style={s.feedWrap}><Action onPress={feedMe} disabled={spinning} icon={<Shuffle size={21} color="white" />}>{spinning ? 'Finding your next bite…' : hasSpun ? 'Feed me again' : 'Feed me'}</Action><T style={s.machineHint}>Lock what you love. Spin what you don’t know.</T></View>
            </View>
            <View style={s.filterRow}><Chip active={openNow} onPress={() => { if (!spinning) { setOpenNow(!openNow); setPicked(null); } }} icon={<View style={[s.dot, { backgroundColor: openNow ? C.orange : C.green }]} />}>Open now</Chip><Chip active={vegetarian} onPress={() => { if (!spinning) { setVegetarian(!vegetarian); setPicked(null); } }} icon={<Leaf size={14} color={vegetarian ? C.orange : C.green} />}>Veggie-friendly</Chip><T style={s.matchCount}>{matches.length} demo spots</T></View>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: shakeOn }} onPress={toggleShake} style={s.shake}><Smartphone size={15} color={C.muted} /><T style={s.shakeText}>{shakeOn ? 'Shake to choose is on · tap to turn off' : 'Feeling spontaneous? Enable shake to choose.'}</T></Pressable>
          </View>
          <View style={[s.heroRight, !wide && { width: '100%', paddingTop: 0 }]}>
            {picked ? <View style={s.featured}>
              <View style={s.featuredImageWrap}><Image source={{ uri: picked.image }} style={[s.featuredImage, small && { height: 260 }]} accessibilityLabel={`Illustrative ${picked.dish}`} /><View style={s.featuredBadge}><Sparkles size={14} color={C.orange} /><T style={s.featuredBadgeText}>{hasSpun ? 'YOUR NEXT GOOD BITE' : 'A LITTLE INSPIRATION'}</T></View><SaveButton restaurant={picked} isSaved={saved.includes(picked.id)} storageReady={storageReady} onSave={save} overlay /><View style={s.photoCaption}><T style={s.photoCaptionText}>A taste of {picked.neighborhood}</T></View></View>
              <View style={s.featuredBody}><View style={s.between}><T style={s.featuredName}>{picked.name}</T><View style={s.bigRating}><ThumbsUp size={15} color={C.green} /><T style={s.bigRatingText}>{picked.likedPercent}%</T></View></View><T style={s.featuredMeta}>{picked.cuisine} · {priceText(picked.price)} · {picked.neighborhood}</T><T style={s.description}>{picked.description}</T><View style={s.featuredFooter}><T style={s.sampleLabel}>FICTIONAL DEMO SPOT</T><Pressable accessibilityRole="button" accessibilityLabel={`Take a look at ${picked.name}`} onPress={() => setDetail(picked)} style={s.lookButton}><T style={s.lookText}>Take a look</T><ArrowRight size={17} color={C.orange} /></Pressable></View></View>
            </View> : <View style={[s.featured, s.emptyPick]}><View style={s.emptyIcon}><Spoon size={52} /></View><T style={s.emptyTitle}>{matches.length ? 'Something good is waiting.' : 'A little too particular?'}</T><T style={s.emptyText}>{matches.length ? `${matches.length} demo spots fit your mood.\nGive it a spin and meet your next bite.` : 'No demo spots match this combination.\nUnlock a choice or clear your filters.'}</T><Action onPress={matches.length ? feedMe : reset} icon={matches.length ? <Shuffle size={18} color="white" /> : <RotateCcw size={18} color="white" />}>{matches.length ? 'Let’s find a spot' : 'Reset my choices'}</Action></View>}
            <View style={s.marginNote}><Heart size={14} color={C.orange} /><T style={s.marginNoteText}>Your new usual might be somewhere unusual.</T></View>
          </View>
        </View>
        <View style={[s.sectionHead, small && { marginTop: 35 }]}><View><T style={s.sectionEyebrow}>A FEW GOOD PLACES TO START</T><T accessibilityRole="header" style={s.sectionTitle}>What are you craving?</T></View><Pressable accessibilityRole="button" onPress={() => changeTab('explore')} style={s.inline}><T style={s.textLink}>{small ? 'Explore' : 'Explore all spots'}</T><ArrowRight size={17} color={C.orange} /></Pressable></View>
        <View style={s.cards}>{RESTAURANTS.slice(1, 5).map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} isSaved={saved.includes(restaurant.id)} storageReady={storageReady} onSave={save} onOpen={setDetail} wide={wide} small={small} />)}</View>
        <View style={[s.bottomBanner, small && { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={s.inline}><Spoon size={25} color={C.green} /><T style={s.bannerText}>Good taste. A little chance. No dinner debate.</T></View><T style={s.bannerSmall}>Made for the “I don’t know, you pick” people.</T></View>
      </> : <>
        <View style={s.pageIntro}><T style={s.sectionEyebrow}>{tab === 'explore' ? 'FOLLOW YOUR APPETITE' : 'FOR ANOTHER HUNGRY DAY'}</T><T accessibilityRole="header" style={[s.headline, small && { fontSize: 44, lineHeight: 50 }]}>{tab === 'explore' ? 'Find your kind of good.' : 'Your little black book.'}</T><T style={s.subtitle}>{tab === 'explore' ? 'A whole neighborhood of possibilities. What sounds good?' : `${saved.length} saved ${saved.length === 1 ? 'spot' : 'spots'}. All your “we should go there” places, together.`}</T></View>
        {tab === 'explore' && <><View style={s.searchBox}><Search size={20} color={C.muted} /><TextInput accessibilityLabel="Search restaurants, cuisines, or neighborhoods" placeholder="A restaurant, a craving, a neighborhood…" placeholderTextColor={C.muted} value={search} onChangeText={setSearch} style={s.searchInput} />{!!search && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')}><X size={18} color={C.muted} /></Pressable>}</View><View style={s.cuisineRow}><Chip active={exploreCuisine === null} onPress={() => setExploreCuisine(null)}>All cravings</Chip>{cuisines.map(cuisine => <Chip key={cuisine} active={exploreCuisine === cuisine} onPress={() => setExploreCuisine(cuisine)}>{cuisine}</Chip>)}</View><View style={s.resultsLabel}><T style={s.meta}>{browsing.length} sample {browsing.length === 1 ? 'restaurant' : 'restaurants'} · Denver demo collection</T><SlidersHorizontal size={16} color={C.muted} /></View></>}
        <View style={s.cards}>{(tab === 'explore' ? browsing : savedRestaurants).map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} isSaved={saved.includes(restaurant.id)} storageReady={storageReady} onSave={save} onOpen={setDetail} wide={wide} small={small} />)}</View>
        {(tab === 'explore' ? browsing : savedRestaurants).length === 0 && <View style={s.emptyList}><Bookmark size={42} color={C.orange} /><T style={s.emptyTitle}>{tab === 'saved' ? 'A table for your favorites.' : 'Nothing on this menu yet.'}</T><T style={s.emptyText}>{tab === 'saved' ? 'Tap the bookmark on any spot to keep it here.\nYour list stays on this device.' : 'Try a different craving or clear your search.'}</T><Action onPress={() => { if (tab === 'saved') changeTab('explore'); else { setSearch(''); setExploreCuisine(null); } }}>{tab === 'saved' ? 'Find something delicious' : 'Clear search & filters'}</Action></View>}
      </>}
      <View style={[s.footer, small && { alignItems: 'flex-start' }]}><T style={s.footerText}>Spoonfed · First taste, v0.1.0</T><Pressable accessibilityRole="button" onPress={() => setAbout(true)}><T style={s.footerLink}>Sample places, photos & ratings · About this draft</T></Pressable></View>
    </ScrollView>
    {!wide && <SafeAreaView edges={['bottom']} style={s.mobileNav}><View style={s.mobileNavInner}>{tabs.map(({ key, text, icon: Icon }) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => changeTab(key)} style={s.mobileNavItem}><Icon size={21} color={tab === key ? C.orange : C.muted} /><T style={[s.mobileNavText, tab === key && { color: C.orange }]}>{text}{key === 'saved' && saved.length ? ` (${saved.length})` : ''}</T></Pressable>)}</View></SafeAreaView>}
    {!!notice && !modalOpen && <Notice message={notice} onDismiss={() => setNotice('')} bottomNav={!wide} />}
    <Modal visible={modalOpen} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={closeModal}>
      <View style={s.modalBackdrop}><Pressable accessibilityLabel="Close dialog" onPress={closeModal} style={StyleSheet.absoluteFill} /><View accessibilityViewIsModal style={[s.modal, small && { maxHeight: '92%', width: '100%' }]}><View style={s.modalTop}><T style={s.modalEyebrow}>{chooser ? 'MAKE IT YOUR KIND OF MEAL' : detail ? 'MEET YOUR NEXT BITE' : 'A LITTLE MORE ABOUT SPOONFED'}</T><Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={closeModal} style={s.closeButton}><X size={21} color={C.ink} /></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalContent}>
        {chooser && <><T style={s.modalTitle}>Choose your {chooser === 'price' ? 'budget' : chooser === 'neighborhood' ? 'neighborhood' : 'cuisine'}.</T><T style={s.modalDescription}>Picking an option locks it for your next spin.</T><View style={s.optionList}>{[null, ...options[chooser]].map(value => <Pressable key={String(value)} accessibilityRole="button" accessibilityState={{ selected: choices[chooser] === value }} onPress={() => selectChoice(value)} style={[s.option, choices[chooser] === value && s.optionSelected]}><T style={s.optionText}>{label(chooser, value)}</T>{choices[chooser] === value && <Check size={20} color={C.orange} />}</Pressable>)}</View></>}
        {detail && <><Image source={{ uri: detail.image }} style={s.detailImage} accessibilityLabel={`Illustrative ${detail.cuisine} food`} /><View style={s.detailHeading}><T style={s.modalTitle}>{detail.name}</T><View style={s.rating}><ThumbsUp size={14} color={C.green} /><T style={s.ratingText}>{detail.likedPercent}% liked</T></View></View><T style={s.meta}>{detail.cuisine} · {priceText(detail.price)} · {detail.neighborhood}</T><T style={s.modalDescription}>{detail.description}</T><View style={s.detailTags}>{detail.tags.map(tag => <View key={tag} style={s.tag}><T style={s.tagText}>{tag}</T></View>)}</View><View style={s.detailBlock}><T style={s.sectionEyebrow}>THE ORDER WE’RE DREAMING OF</T><T style={s.dishTitle}>{detail.dish}</T><T style={s.modalDescription}>{detail.hours}{'\n'}{detail.votes} sample votes · {detail.distanceMiles} mi from the demo center</T></View><View style={s.demoNote}><Info size={18} color={C.green} /><T style={s.demoNoteText}>This is a fictional restaurant with sample hours and ratings. The photo is illustrative. The map opens its demo neighborhood, not a real venue.</T></View><View style={s.detailActions}><Action disabled={!storageReady} onPress={() => save(detail)} icon={<Bookmark size={17} color="white" fill={saved.includes(detail.id) ? 'white' : 'transparent'} />}>{saved.includes(detail.id) ? 'Saved to your list' : 'Save this spot'}</Action><Action secondary onPress={() => { const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detail.neighborhood}, Denver, Colorado`)}`; Linking.openURL(url).catch(() => setNotice('Could not open maps on this device.')); }} icon={<Navigation size={17} color={C.ink} />}>View demo neighborhood</Action></View></>}
        {locationInfo && <><View style={s.emptyIcon}><MapPin size={35} color={C.orange} /></View><T style={s.modalTitle}>First stop: Denver.</T><T style={s.modalDescription}>This first draft explores a fictional Denver restaurant collection. Try RiNo, LoHi, Capitol Hill, Cherry Creek, and Downtown with the area reel.</T><View style={s.demoNote}><Info size={18} color={C.green} /><T style={s.demoNoteText}>Your location is not being tracked. Live nearby restaurants and city search will come with a connected restaurant data provider.</T></View><Action disabled={spinning} onPress={() => { if (spinBusy.current) return; setLocationInfo(false); changeTab('discover'); setChooser('neighborhood'); }} icon={<MapPin size={18} color="white" />}>Explore a demo neighborhood</Action></>}
        {about && <><View style={s.inline}><Spoon size={37} /><T style={s.modalTitle}>Meet Spoonfed.</T></View><T style={s.modalDescription}>A little less deciding. A lot more eating. Inspired by the joy of Urbanspoon’s original shake-to-discover experience, with a new name and a fresh point of view.</T><View style={s.detailBlock}><T style={s.dishTitle}>Your first taste</T><T style={s.modalDescription}>Spin neighborhood, cuisine, and price. Lock what matters. Explore sample spots, open their details, and save favorites on this device. No account needed.</T></View><View style={s.demoNote}><Info size={18} color={C.green} /><T style={s.demoNoteText}>All restaurants, ratings, hours, and distances are sample data. Food photography is illustrative. This draft has no live reservations, reviews, or restaurant feed.</T></View><T style={s.modalDescription}>Built for iOS, Android, and web with Expo. Version 0.1.0 is a local development draft; it has not been released in app stores. Spoonfed is an independent project, unaffiliated with Urbanspoon or Zomato.</T><Action onPress={closeModal}>Sounds delicious</Action></>}
      </ScrollView>{!!notice && <Notice message={notice} onDismiss={() => setNotice('')} inline />}</View></View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  text: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.ink }, safe: { flex: 1, backgroundColor: C.bg }, loading: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: { borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.bg }, headerInner: { width: '100%', maxWidth: 1280, alignSelf: 'center', height: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, wordmark: { fontFamily: 'DMSans_700Bold', fontSize: 29, letterSpacing: -1.5 }, nav: { flexDirection: 'row', gap: 10 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 19, paddingVertical: 12, borderRadius: 25 }, navActive: { backgroundColor: C.light }, navText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.muted }, location: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 12 }, locationText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  content: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 40, paddingTop: 35, paddingBottom: 20 }, topline: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 27, alignItems: 'center' }, inline: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange }, eyebrow: { fontSize: 10, letterSpacing: 1.9, fontFamily: 'DMSans_700Bold', color: C.muted }, demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6 }, demoText: { fontSize: 9, letterSpacing: 1.1, color: C.muted, fontFamily: 'DMSans_600SemiBold' },
  hero: { flexDirection: 'row', gap: 60 }, heroLeft: { width: '49%' }, heroRight: { flex: 1, paddingTop: 8 }, headline: { fontFamily: 'Fraunces_500Medium', fontSize: 62, lineHeight: 66, letterSpacing: -2.5 }, subtitle: { fontSize: 15, lineHeight: 25, color: C.muted, marginTop: 17 },
  machine: { marginTop: 27, backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingTop: 18, paddingBottom: 17, boxShadow: '0px 5px 20px rgba(45, 40, 25, 0.035)' }, machineHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 21, marginBottom: 19 }, machineTitle: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' }, reset: { padding: 5 }, reels: { flexDirection: 'row', paddingHorizontal: 8 }, reel: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 5 }, reelBorder: { borderRightWidth: 1, borderRightColor: C.line }, reelLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }, reelLabelText: { fontSize: 9, letterSpacing: 1.7, fontFamily: 'DMSans_700Bold', color: C.muted }, reelWindow: { alignSelf: 'stretch', alignItems: 'center' }, reelGhost: { color: '#C1C2B9', fontSize: 13, height: 27, paddingTop: 4 }, reelChoice: { backgroundColor: '#F4F3ED', borderRadius: 8, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 7, height: 46, marginVertical: 1 }, reelValue: { fontFamily: 'DMSans_700Bold', fontSize: 18, flexShrink: 1, letterSpacing: -.4 }, lockButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 13, marginTop: 8, borderRadius: 16, backgroundColor: '#F8F8F4' }, lockActive: { backgroundColor: C.light }, lockText: { fontSize: 10, color: C.muted, fontFamily: 'DMSans_600SemiBold' },
  feedWrap: { paddingHorizontal: 20, marginTop: 20 }, action: { backgroundColor: C.orange, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, actionText: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: 'white' }, secondary: { backgroundColor: '#F1F1E9', borderWidth: 1, borderColor: C.line }, pressed: { opacity: .76, transform: [{ scale: .99 }] }, machineHint: { fontSize: 10, textAlign: 'center', marginTop: 12, color: C.muted }, filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#DEDFD4', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 8 }, chipText: { fontSize: 11, fontFamily: 'DMSans_500Medium' }, chipActive: { backgroundColor: C.light, borderColor: '#F5BCA7' }, matchCount: { marginLeft: 'auto', fontSize: 10, color: C.muted }, shake: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 18, paddingBottom: 5 }, shakeText: { fontSize: 10, color: C.muted },
  featured: { backgroundColor: C.white, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: C.line, boxShadow: '0px 10px 26px rgba(48, 42, 22, 0.05)' }, featuredImageWrap: { position: 'relative' }, featuredImage: { height: 333, width: '100%', backgroundColor: '#D6D3C6' }, featuredBadge: { position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: C.white }, featuredBadgeText: { fontSize: 9, letterSpacing: 1, fontFamily: 'DMSans_700Bold' }, saveButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFFEF', alignItems: 'center', justifyContent: 'center' }, saveOverlay: { position: 'absolute', top: 17, right: 17 }, photoCaption: { position: 'absolute', bottom: 19, left: 20, backgroundColor: '#282A2390', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }, photoCaptionText: { color: 'white', fontSize: 11, fontFamily: 'DMSans_500Medium' }, featuredBody: { paddingHorizontal: 25, paddingTop: 23, paddingBottom: 20 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, featuredName: { fontFamily: 'Fraunces_600SemiBold', fontSize: 30, letterSpacing: -.8, flexShrink: 1 }, bigRating: { backgroundColor: C.pale, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, bigRatingText: { color: C.green, fontFamily: 'DMSans_700Bold', fontSize: 13 }, featuredMeta: { color: C.muted, fontSize: 12, marginTop: 8 }, description: { color: C.muted, fontSize: 13, lineHeight: 22, marginTop: 17 }, featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 18, borderTopWidth: 1, borderTopColor: C.line }, sampleLabel: { fontSize: 8, letterSpacing: 1.2, color: C.muted }, lookButton: { flexDirection: 'row', alignItems: 'center', gap: 7 }, lookText: { color: C.orange, fontFamily: 'DMSans_700Bold', fontSize: 12 }, marginNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 }, marginNoteText: { color: C.muted, fontSize: 11 },
  sectionHead: { marginTop: 47, marginBottom: 21, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }, sectionEyebrow: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 1.8, color: C.muted }, sectionTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 31, letterSpacing: -.9, marginTop: 8 }, textLink: { color: C.orange, fontFamily: 'DMSans_600SemiBold', fontSize: 12 }, cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 }, smallCard: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 15, overflow: 'hidden' }, cardImage: { height: 166, width: '100%', backgroundColor: '#D6D3C6' }, smallCardBody: { padding: 15 }, restaurantTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15, letterSpacing: -.35, flexShrink: 1 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 4 }, ratingText: { color: C.green, fontFamily: 'DMSans_700Bold', fontSize: 11 }, meta: { fontSize: 11, lineHeight: 20, color: C.muted, marginTop: 6 }, cardDish: { fontSize: 11, color: C.ink, marginTop: 10 }, bottomBanner: { backgroundColor: C.pale, borderRadius: 12, padding: 22, marginTop: 30, gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, bannerText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.green, flexShrink: 1 }, bannerSmall: { fontSize: 11, color: C.green }, footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 8 }, footerText: { color: C.muted, fontSize: 10 }, footerLink: { color: C.muted, fontSize: 10, textDecorationLine: 'underline' },
  pageIntro: { marginTop: 20, marginBottom: 35, gap: 6 }, searchBox: { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: C.line }, searchInput: { fontFamily: 'DMSans_400Regular', color: C.ink, flex: 1, fontSize: 15, paddingVertical: 19, minWidth: 0 }, cuisineRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 20 }, resultsLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, emptyList: { alignItems: 'center', paddingVertical: 60, gap: 20 }, emptyPick: { minHeight: 490, padding: 30, alignItems: 'center', justifyContent: 'center', gap: 24 }, emptyIcon: { width: 88, height: 88, backgroundColor: C.light, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, emptyTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 28, textAlign: 'center' }, emptyText: { textAlign: 'center', color: C.muted, lineHeight: 24, fontSize: 14 },
  mobileNav: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg }, mobileNavInner: { flexDirection: 'row', justifyContent: 'space-around' }, mobileNavItem: { alignItems: 'center', gap: 5, padding: 13, flex: 1 }, mobileNavText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: C.muted }, toast: { position: 'absolute', bottom: 24, alignSelf: 'center', maxWidth: 600, width: '90%', padding: 18, backgroundColor: C.ink, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 14, boxShadow: '0px 6px 20px rgba(0,0,0,0.12)' }, toastText: { color: 'white', flex: 1, fontSize: 13, lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: '#20221975', alignItems: 'center', justifyContent: 'center', padding: 18 }, modal: { width: 540, maxWidth: '100%', maxHeight: '88%', backgroundColor: C.bg, borderRadius: 23, overflow: 'hidden' }, modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 23, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.line }, modalEyebrow: { fontSize: 9, letterSpacing: 1.5, color: C.muted, fontFamily: 'DMSans_700Bold', flexShrink: 1 }, closeButton: { padding: 5 }, modalContent: { padding: 25 }, modalTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 31, letterSpacing: -.8, flexShrink: 1 }, modalDescription: { color: C.muted, fontSize: 14, lineHeight: 24, marginTop: 12, marginBottom: 18 }, optionList: { gap: 7, marginTop: 10 }, option: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionSelected: { backgroundColor: C.light, borderColor: '#F2BBA9' }, optionText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15 }, detailImage: { height: 240, width: '100%', borderRadius: 14, backgroundColor: '#D6D3C6' }, detailHeading: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, detailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tag: { backgroundColor: C.pale, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 }, tagText: { color: C.green, fontSize: 10 }, detailBlock: { paddingTop: 24, marginTop: 10, borderTopWidth: 1, borderTopColor: C.line }, dishTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 23, marginTop: 8 }, demoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, borderRadius: 10, backgroundColor: C.pale, marginBottom: 23 }, demoNoteText: { color: C.green, fontSize: 12, lineHeight: 20, flex: 1 }, detailActions: { gap: 10 },
});
