"use client"
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Loader2, MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import { getWeatherInfo } from '@/lib/weatherCodes';

// Shadcn Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from '@/components/ModeToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import Image from 'next/image';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

// รายชื่อจังหวัดตัวอย่าง (เพิ่มให้ครบ 77 จังหวัดได้ภายหลัง)
const THAI_PROVINCES = [
  { value: "bangkok", label: "กรุงเทพมหานคร", lat: 13.7563, lon: 100.5018 },
  { value: "chiangmai", label: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
  { value: "chiangrai", label: "เชียงราย", lat: 19.9105, lon: 99.8406 },
  { value: "phuket", label: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
  { value: "khonkaen", label: "ขอนแก่น", lat: 16.4322, lon: 102.8236 },
  { value: "chonburi", label: "ชลบุรี", lat: 13.3611, lon: 100.9847 },
  { value: "nakhonratchasima", label: "นครราชสีมา", lat: 14.9799, lon: 102.0978 },
  { value: "songkhla", label: "สงขลา", lat: 7.1756, lon: 100.6143 },
  { value: "ayutthaya", label: "อยุธยา", lat: 14.3532, lon: 100.5684 },
  { value: "kanchanaburi", label: "กาญจนบุรี", lat: 14.0225, lon: 99.5327 },
  { value: "suratthani", label: "สุราษฎร์ธานี", lat: 9.1382, lon: 99.3217 },
  { value: "ubonratchathani", label: "อุบลราชธานี", lat: 15.2287, lon: 104.8594 },
];

export default function Home() {
  const handleProvinceChange = (value: string) => {
    const province = THAI_PROVINCES.find((p) => p.value === value);
    if (province) {
      handleLocationSelect(province.lat, province.lon);
    }
  };
  const handleMobileProvinceChange = (value: string) => {
    handleProvinceChange(value);
    setIsSheetOpen(false);
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);

  // State สำหรับเปิดปิด Sheet ใน Mobile
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLocationSelect = async (lat: number, lon: number) => {
    setSelectedPos([lat, lon]);
    setLoading(true);
    // ใน Mobile เมื่อจิ้มแล้ว ให้เปิด Sheet ข้อมูลขึ้นมาเลย
    if (window.innerWidth < 768) setIsSheetOpen(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const res = await axios.get(`${API_URL}/api/weather?lat=${lat}&lon=${lon}`);
      let finalData = res.data;
      if (!finalData.weather) {
        console.log("Backend failed to get weather, fetching from Client instead...");

        const normalizedLon = ((lon + 180) % 360 + 360) % 360 - 180;
        // ยิง Open-Meteo โดยตรงจาก Browser (ไม่โดนแบนแน่นอน)
        const weatherRes = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${normalizedLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        // เอาข้อมูลมาแปะรวมกัน
        finalData.weather = weatherRes.data;
      }
      setData(finalData);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true); // หมุนรอก่อนเลย
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
        },
        (error) => {
          console.error(error);
          alert("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS");
          setLoading(false);
        }
      );
    } else {
      alert("Browser ของคุณไม่รองรับ Geolocation");
    }
  };

  // Component แสดงข้อมูล (แยกออกมาเพื่อใช้ซ้ำทั้ง Desktop และ Mobile)
  const WeatherDetails = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!data && !loading && (
        <div className="text-center text-muted-foreground py-10">
          <MapPin className="mx-auto h-12 w-12 opacity-50 mb-2" />
          <p>เลือกจุดบนแผนที่เพื่อดูข้อมูล</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      )}

      {data && !loading && (
        <>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{data.location}</h2>
            <p className="text-sm text-muted-foreground">{data.full_address}</p>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <span className="text-6xl font-bold">
                  {Math.round(data.weather.current.temperature_2m)}°
                </span>
                <p className={`mt-2 font-medium ${getWeatherInfo(data.weather.current.weather_code).color}`}>
                  {getWeatherInfo(data.weather.current.weather_code).label}
                </p>
              </div>
              <div className="text-6xl">
                {data.weather.current.is_day ? "☀️" : "🌙"}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">ความชื้น</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 font-bold text-2xl">
                {data.weather.current.relative_humidity_2m}%
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">แรงลม</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 font-bold text-2xl">
                {data.weather.current.wind_speed_10m} <span className="text-sm font-normal">km/h</span>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">พยากรณ์ 7 วัน</h3>
            <div className="space-y-2">
              {data.weather.daily.time.map((date: string, index: number) => (
                <div key={date} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-accent">
                  <span className="w-24 font-medium">{new Date(date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' })}</span>
                  <span className="text-muted-foreground flex-1 text-center">
                    {getWeatherInfo(data.weather.daily.weather_code[index]).label}
                  </span>
                  <span className="font-bold">
                    {Math.round(data.weather.daily.temperature_2m_max[index])}°
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      {Math.round(data.weather.daily.temperature_2m_min[index])}°
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="flex items-center justify-between p-4 border-b h-16 shrink-0 z-20 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Image
            src="/mainlogo.png"       // ไม่ต้องใส่ /public นำหน้า ใส่ / ได้เลย
            alt="App Logo"        // ใส่คำอธิบายรูป
            width={40}            // กำหนดความกว้าง (px)
            height={40}           // กำหนดความสูง (px)
            className="w-10 h-10 object-contain" // ใช้ class คุมขนาดอีกทีกันพลาด
          /> <span className="hidden sm:inline">Weather</span>
        </div>
        <div className="flex gap-2">
          {/* ปุ่มเปิดดูข้อมูลใน Mobile (แสดงเฉพาะจอเล็ก) */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary">ดูข้อมูล</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>สภาพอากาศ</SheetTitle>
                </SheetHeader>
                <div className="px-4 mb-4 flex gap-2">
                  <Select onValueChange={handleMobileProvinceChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ค้นหาจังหวัด..." />
                    </SelectTrigger>
                    <SelectContent>
                      {THAI_PROVINCES.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* ปุ่ม GPS สำหรับ Mobile (optional: เผื่ออยากกดตรงนี้ด้วย) */}
                  <Button size="icon" variant="outline" onClick={() => {
                    handleCurrentLocation();
                    setIsSheetOpen(false); // กดแล้วปิด sheet เหมือนกัน
                  }}>
                    <Navigation size={16} />
                  </Button>
                </div>
                <ScrollArea className="h-full pl-4 pr-4 pb-10">
                  <WeatherDetails />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          <ModeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar (ซ่อนใน Mobile) */}
        <aside className="hidden md:flex flex-col w-[400px] border-r overflow-y-auto">
          <ScrollArea className="flex-1 p-6">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapIcon size={18} /> เลือกพื้นที่
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCurrentLocation}
                  className="text-xs h-9" // ปรับความสูงให้เท่า Dropdown
                >
                  <Navigation size={14} className="mr-1" /> พิกัดฉัน
                </Button>
              </div>

              <Select onValueChange={handleProvinceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ค้นหาจังหวัด..." />
                </SelectTrigger>
                <SelectContent>
                  {THAI_PROVINCES.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <WeatherDetails />
          </ScrollArea>
        </aside>

        {/* Map Area (เต็มจอใน Mobile) */}
        <main className="flex-1 relative bg-slate-100 dark:bg-slate-900">
          <div className="absolute inset-0 z-0">
            <Map selectedPos={selectedPos} onLocationSelect={handleLocationSelect} />
          </div>
          <div className="md:hidden absolute bottom-6 right-4 z-[400]">
            <Button
              size="icon"
              className="rounded-full h-14 w-14 shadow-xl border-2 border-white"
              onClick={handleCurrentLocation}
            >
              <Navigation className="h-6 w-6" />
              <span className="sr-only">พิกัดปัจจุบัน</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}