// แปลงรหัส WMO Weather Code เป็นข้อความภาษาไทยและสี
export const getWeatherInfo = (code: number) => {
    const codes: Record<number, { label: string; color: string; icon: string }> = {
        0: { label: "ท้องฟ้าแจ่มใส", color: "text-yellow-500", icon: "sun" },
        1: { label: "มีเมฆเป็นส่วนมาก", color: "text-blue-400", icon: "cloud-sun" },
        2: { label: "มีเมฆมาก", color: "text-gray-500", icon: "cloud" },
        3: { label: "มืดครึ้ม", color: "text-gray-600", icon: "cloud" },
        45: { label: "หมอก", color: "text-gray-400", icon: "fog" },
        48: { label: "หมอกลงจัด", color: "text-gray-400", icon: "fog" },
        51: { label: "ฝนปรอยๆ", color: "text-blue-300", icon: "drizzle" },
        53: { label: "ฝนตกปานกลาง", color: "text-blue-500", icon: "rain" },
        55: { label: "ฝนตกหนัก", color: "text-blue-700", icon: "rain" },
        61: { label: "ฝนตกเล็กน้อย", color: "text-blue-400", icon: "rain" },
        63: { label: "ฝนตก", color: "text-blue-600", icon: "rain" },
        65: { label: "ฝนตกหนักมาก", color: "text-blue-800", icon: "rain" },
        80: { label: "ฝนฟ้าคะนอง", color: "text-indigo-600", icon: "storm" },
        81: { label: "ฝนฟ้าคะนองรุนแรง", color: "text-indigo-800", icon: "storm" },
        95: { label: "พายุฝนฟ้าคะนอง", color: "text-purple-600", icon: "thunder" },
    };
    return codes[code] || { label: "ไม่ทราบข้อมูล", color: "text-gray-500", icon: "unknown" };
};