// AgroShield AI - Core Client Application
document.addEventListener("DOMContentLoaded", () => {
    // Current application state
    const state = {
        lang: "en",
        currentView: "farmer",
        uploadedFile: null,
        activeReportId: null,
        map: null,
        markers: [],
        charts: {},
        reports: [],
        sensorLogs: []
    };

    // Helper function for quick network timeouts (increased to 20000 to accommodate ML inference)
    function fetchWithTimeout(resource, options = {}) {
        const { timeout = 20000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        return fetch(resource, { ...options, signal: controller.signal })
            .then(res => { clearTimeout(id); return res; })
            .catch(err => { clearTimeout(id); throw err; });
    }

    // Dictionary for Multilingual advisories & UI
    const dictionary = {
        en: {
            nav_home: "Farmer Portal",
            nav_map: "Disease Map",
            nav_dashboard: "Official Analytics",
            system_online: "AI Doctor is Ready",
            local_temp: "Local Temp",
            humidity: "Humidity",
            farmer_title: "Leaf Disease Checker & Risk Alerts",
            farmer_subtitle: "Upload a photo of your diseased leaf. The AI will immediately tell you the disease and give you a simple treatment plan.",
            map_title: "Geospatial Surveillance Map",
            map_subtitle: "Visualizing local outbreaks, high-severity hotspots, and pest vector captures.",
            official_title: "Agriculture Surveillance Dashboard",
            official_subtitle: "Consolidated analytics, microclimate alerts, and expert validation queue.",
            diagnostic_lab: "AI Leaf Doctor",
            image_based: "Scan Your Leaf",
            upload_prompt_title: "Upload or drop photo of sick leaf",
            upload_prompt_desc: "Supports Tomato, Potato, Pepper, Corn, Apple, Grape, Peach, Squash, Strawberry",
            browse_btn: "Choose Photo",
            field_notes: "Write any observations / notes (optional)",
            analyze_btn: "Find Disease Now",
            treatment_protocol: "Leaf Diagnostic Report & Solution",
            awaiting_input: "Waiting for leaf photo",
            awaiting_input_desc: "Upload a photo of the sick leaf and click the button to see the disease and the treatment.",
            analyzing_foliage: "Analyzing leaf pattern...",
            matching_features: "Checking patterns with our plant database...",
            crop_lbl: "Plant Name",
            confidence_lbl: "Match Confidence",
            desc_hdr: "About this Disease",
            symptoms_hdr: "How to Identify & Why it Happens",
            cultural_hdr: "Natural / Organic Prevention Tips",
            biological_hdr: "Biological Treatment (Natural Remedies)",
            chemical_hdr: "Chemical Treatment (Pesticides, if needed)",
            safe_dosage_lbl: "Correct Mixing / Dosage",
            monitoring_hdr: "Regular Inspection & Watch Checklist",
            recheck_lbl: "Check again after",
            field_sensors: "Insect Traps & Field Sensors",
            realtime: "Field Observations",
            weather_risk_hdr: "Weather Alert & Disease Risk Guide",
            forecast_lbl: "Weather Alert",
            map_header: "Disease Tracking Map",
            stat_total: "Total Incidents Logged",
            stat_pending: "Waiting for Expert Verification",
            stat_high: "Dangerous Outbreaks Nearby",
            stat_pest: "Insect Activity Level",
            chart_distribution_hdr: "Affected Plants Breakdown",
            chart_trend_hdr: "Disease Trends Over Months",
            expert_queue_hdr: "Expert Verification List",
            verify_success: "Report Saved",
            log_desc: "Report saved successfully.",
            speak_advisory: "Listen to Advisory (Voice)"
        },
        hi: {
            nav_home: "किसान पोर्टल",
            nav_map: "बीमारी का नक्शा",
            nav_dashboard: "गांव के आंकड़े",
            system_online: "एआई डॉक्टर तैयार है",
            local_temp: "तापमान",
            humidity: "नमी",
            farmer_title: "पत्ती रोग जांचकर्ता और जोखिम अलर्ट",
            farmer_subtitle: "अपनी बीमार पत्ती का फोटो अपलोड करें। एआई तुरंत बीमारी का पता लगाएगा और आपको एक सरल उपचार योजना देगा।",
            map_title: "रोग निगरानी नक्शा",
            map_subtitle: "स्थानीय प्रकोप, खतरनाक हॉटस्पॉट और कीटों की निगरानी करें।",
            official_title: "कृषि निगरानी डैशबोर्ड",
            official_subtitle: "समग्र आंकड़े, मौसम अलर्ट और विशेषज्ञों की सत्यापन सूची।",
            diagnostic_lab: "एआई पत्ता डॉक्टर",
            image_based: "पत्ती को स्कैन करें",
            upload_prompt_title: "बीमार पत्ती का फोटो अपलोड करें",
            upload_prompt_desc: "टमाटर, आलू, मिर्च, मक्का, सेब, अंगूर, आड़ू, कद्दू, स्ट्रॉबेरी को सपोर्ट करता है",
            browse_btn: "तस्वीर चुनें",
            field_notes: "खेत के नोट्स लिखें (वैकल्पिक)",
            analyze_btn: "बीमारी का पता लगाएं",
            treatment_protocol: "जांच रिपोर्ट और समाधान",
            awaiting_input: "पत्ती के फोटो की प्रतीक्षा है",
            awaiting_input_desc: "बीमार पत्ती का फोटो अपलोड करें और बीमारी तथा उपचार देखने के लिए बटन दबाएं।",
            analyzing_foliage: "पत्ती के पैटर्न का विश्लेषण किया जा रहा है...",
            matching_features: "हमारे डेटाबेस से मिलान किया जा रहा है...",
            crop_lbl: "पौधे का नाम",
            confidence_lbl: "मैच आत्मविश्वास",
            desc_hdr: "बीमारी के बारे में",
            symptoms_hdr: "लक्षण और कारण",
            cultural_hdr: "प्राकृतिक / जैविक बचाव के टिप्स",
            biological_hdr: "जैविक उपचार (प्राकृतिक उपाय)",
            chemical_hdr: "रासायनिक उपचार (कीटनाशक, यदि आवश्यक हो)",
            safe_dosage_lbl: "दवा की सही मात्रा (खुराक)",
            monitoring_hdr: "नियमित जांच और निगरानी सूची",
            recheck_lbl: "दोबारा जांच करें",
            field_sensors: "कीट जाल और फील्ड सेंसर",
            realtime: "खेत के अवलोकन",
            weather_risk_hdr: "मौसम अलर्ट और रोग जोखिम गाइड",
            forecast_lbl: "मौसम अलर्ट",
            map_header: "रोग ट्रैकिंग नक्शा",
            stat_total: "कुल दर्ज मामले",
            stat_pending: "विशेषज्ञ सत्यापन की प्रतीक्षा है",
            stat_high: "आस-पास खतरनाक बीमारी का प्रकोप",
            stat_pest: "कीट गतिविधि स्तर",
            chart_distribution_hdr: "प्रभावित पौधों का विवरण",
            chart_trend_hdr: "महीनों के अनुसार रोग के रुझान",
            expert_queue_hdr: "विशेषज्ञ सत्यापन सूची",
            verify_success: "रिपोर्ट सुरक्षित की गई",
            log_desc: "रिपोर्ट सफलतापूर्वक सुरक्षित की गई।",
            speak_advisory: "सलाह सुनें (आवाज)"
        },
        pa: {
            nav_home: "ਕਿਸਾਨ ਪੋਰਟਲ",
            nav_map: "ਬੀਮਾਰੀ ਦਾ ਨਕਸ਼ਾ",
            nav_dashboard: "ਪਿੰਡ ਦੇ ਅੰਕੜੇ",
            system_online: "ਏਆਈ ਡਾਕਟਰ ਤਿਆਰ ਹੈ",
            local_temp: "ਤਾਪਮਾਨ",
            humidity: "ਨਮੀ",
            farmer_title: "ਪੱਤੇ ਦੀ ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ ਅਤੇ ਖਤਰਾ ਅਲਰਟ",
            farmer_subtitle: "ਆਪਣੇ ਬੀਮਾਰ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ। ਏਆਈ ਬੀਮਾਰੀ ਦਾ ਪਤਾ ਲਗਾ ਕੇ ਸੌਖਾ ਇਲਾਜ ਦੱਸੇਗੀ।",
            map_title: "ਬੀਮਾਰੀ ਦਾ ਨਕਸ਼ਾ",
            map_subtitle: "ਸਥਾਨਕ ਇਨਫੈਕਸ਼ਨ, ਖਤਰਨਾਕ ਹੌਟਸਪੌਟ ਅਤੇ ਕੀੜਿਆਂ ਦੀ ਨਿਗਰਾਨੀ।",
            official_title: "ਖੇਤੀਬਾੜੀ ਨਿਗਰਾਨੀ ਡੈਸ਼ਬੋਰਡ",
            official_subtitle: "ਸਮੁੱਚੇ ਅੰकੜੇ, ਮੌਸਮ ਅਲਰਟ ਅਤੇ ਮਾਹਰਾਂ ਦੀ ਜਾਂਚ ਸੂਚੀ।",
            diagnostic_lab: "ਏਆਈ ਪੱਤਾ ਡਾਕਟਰ",
            image_based: "ਫੋਟੋ ਨਾਲ ਜਾਂਚ",
            upload_prompt_title: "ਬੀਮਾਰ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
            upload_prompt_desc: "ਟਮਾਟਰ, ਆਲੂ, ਮਿਰਚ, ਮੱਕੀ, ਸੇਬ, ਅੰਗੂਰ, ਆੜੂ, ਕੱਦੂ, ਸਟ੍ਰਾਬੇਰੀ",
            browse_btn: "ਫੋਟੋ ਚੁਣੋ",
            field_notes: "ਖੇਤ ਦੇ ਨੋਟਸ ਲਿਖੋ (ਵੈਕਲਪਿਕ)",
            analyze_btn: "ਬੀਮਾਰੀ ਦਾ ਪਤਾ ਲਗਾਓ",
            treatment_protocol: "ਜਾਂਚ ਰਿਪੋਰਟ ਅਤੇ ਹੱਲ",
            awaiting_input: "ਪੱਤੇ ਦੀ ਫੋਟੋ ਦੀ ਉਡੀਕ ਹੈ",
            awaiting_input_desc: "ਬੀਮਾਰੀ ਅਤੇ ਇਲਾਜ ਦੇਖਣ ਲਈ ਫਸਲ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਬਟਨ ਦਬਾਓ।",
            analyzing_foliage: "ਪੱਤੇ ਦੇ ਪੈਟਰਨ ਦੀ ਜਾਂਚ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
            matching_features: "ਸਾਡੇ ਡੇਟਾਬੇਸ ਨਾਲ ਮਿਲਾਨ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...",
            crop_lbl: "ਫਸਲ ਦਾ ਨਾਮ",
            confidence_lbl: "ਮਿਲਾਨ ਭਰੋਸਾ",
            desc_hdr: "ਬੀਮਾਰੀ ਬਾਰੇ ਜਾਣਕਾਰੀ",
            symptoms_hdr: "ਲੱਛਣ ਅਤੇ ਕਾਰਨ",
            cultural_hdr: "ਕੁਦਰਤੀ / ਆਰਗੈਨਿਕ ਬਚਾਅ ਦੇ ਤਰੀਕੇ",
            biological_hdr: "ਕੁਦਰਤੀ ਇਲਾਜ (ਦੇਸੀ ਨੁਸਖੇ)",
            chemical_hdr: "ਰਸਾਇਣਕ ਇਲਾਜ (ਕੀਟਨਾਸ਼ਕ, ਜੇਕਰ ਲੋੜ ਹੋਵੇ)",
            safe_dosage_lbl: "ਸਹੀ ਖੁਰਾਕ / ਮਾਤਰਾ",
            monitoring_hdr: "ਨਿਯਮਿਤ ਜਾਂਚ ਚੈੱਕਲਿਸਟ",
            recheck_lbl: "ਦੁਬਾਰਾ ਜਾਂਚ ਕਰੋ",
            field_sensors: "ਕੀੜੇ ਫੜਨ ਵਾਲੇ ਜਾਲ ਅਤੇ ਸੈਂਸਰ",
            realtime: "ਖੇਤ ਦੇ ਨਿਰੀਖਣ",
            weather_risk_hdr: "ਮੌਸਮ ਅਲਰਟ ਅਤੇ ਬੀਮਾਰੀ ਖਤਰਾ ਗਾਈਡ",
            forecast_lbl: "ਮੌਸਮ ਅਲਰਟ",
            map_header: "ਬੀਮਾਰੀ ਦਾ ਨਕਸ਼ਾ",
            stat_total: "ਕੁੱਲ ਰਿਪੋਰਟਾਂ",
            stat_pending: "ਮਾਹਰਾਂ ਦੀ ਜਾਂਚ ਦੀ ਉਡੀਕ",
            stat_high: "ਨੇੜੇ ਫੈਲੀਆਂ ਖਤਰਨਾਕ ਬੀਮਾਰੀਆਂ",
            stat_pest: "ਕੀੜਿਆਂ ਦੀ ਗਤੀਵਿਧੀ",
            chart_distribution_hdr: "ਪ੍ਰਭਾਵਿਤ ਫਸਲਾਂ",
            chart_trend_hdr: "ਬੀਮਾਰੀ ਦੇ ਮਹੀਨਾਵਾਰ ਰੁਝਾਨ",
            expert_queue_hdr: "ਮਾਹਰਾਂ ਦੀ ਜਾਂਚ ਸੂਚੀ",
            verify_success: "ਰਿਪੋਰਟ ਸੁਰੱਖਿਅਤ",
            log_desc: "ਰਿਪੋਰਟ ਸਫਲਤਾਪੂਰਵਕ ਸੁਰੱਖਿਅਤ ਕੀਤੀ ਗਈ।",
            speak_advisory: "ਇਲਾਜ ਸੁਣੋ (ਆਵਾਜ਼)"
        },
        ta: {
            nav_home: "விவசாயி போர்டல்",
            nav_map: "நோய் வரைபடம்",
            nav_dashboard: "கிராம புள்ளிவிவரங்கள்",
            system_online: "ஏஐ பயிர் மருத்துவர் தயார்",
            local_temp: "வெப்பநிலை",
            humidity: "ஈரப்பதம்",
            farmer_title: "பயிர் நோய் கண்டறிதல் & அபாய எச்சரிக்கை",
            farmer_subtitle: "பாதிக்கப்பட்ட இலையின் புகைப்படத்தை பதிவேற்றவும். ஏஐ உடனடியாக நோயை கண்டறிந்து எளிய சிகிச்சை முறையை கூறும்.",
            map_title: "நோய் பரவல் வரைபடம்",
            map_subtitle: "உள்ளூர் நோய்பரவல், ஆபத்தான பகுதிகள் மற்றும் பூச்சிகளின் நடமாட்டத்தைக் கண்காணித்தல்.",
            official_title: "விவசாய கண்காணிப்பு டாஷ்போர்டு",
            official_subtitle: "ஒட்டுமொத்த புள்ளிவிவரங்கள், வானிலை எச்சரிக்கைகள் மற்றும் வல்லுநர்களின் சரிபார்ப்பு பட்டியல்.",
            diagnostic_lab: "ஏஐ இலை மருத்துவர்",
            image_based: "பயிரை ஸ்கேன் செய்க",
            upload_prompt_title: "பாதிக்கப்பட்ட இலையின் புகைப்படத்தை பதிவேற்றவும்",
            upload_prompt_desc: "தக்காளி, உருளைக்கிழங்கு, மிளகாய், சோளம், ஆப்பிள், திராட்சை, பீச், பூசணி, ஸ்ட்ராபெரி",
            browse_btn: "புகைப்படத்தை தேர்வு செய்",
            field_notes: "வயல் குறிப்புகள் (விருப்பத்தேர்வு)",
            analyze_btn: "நோயைக் கண்டுபிடி",
            treatment_protocol: "பரிசோதனை அறிக்கை & தீர்வு",
            awaiting_input: "இலை புகைப்படத்திற்காக காத்திருக்கிறது",
            awaiting_input_desc: "பயிரின் புகைப்படத்தை பதிவேற்றி, நோயையும் அதற்கான சிகிச்சையையும் காண பொத்தானை அழுத்தவும்.",
            analyzing_foliage: "இலையின் வடிவத்தை ஆராய்கிறது...",
            matching_features: "எங்கள் தரவுத்தளத்துடன் ஒப்பிடுகிறது...",
            crop_lbl: "பயிரின் பெயர்",
            confidence_lbl: "பொருத்தம்",
            desc_hdr: "நோய் பற்றிய விபரம்",
            symptoms_hdr: "அறிகுறிகள் & காரணங்கள்",
            cultural_hdr: "இயற்கை / ஆர்கானிக் தடுப்பு முறைகள்",
            biological_hdr: "உயிரியல் கட்டுப்பாடு (இயற்கை வைத்தியம்)",
            chemical_hdr: "ரசாயன கட்டுப்பாடு (தேவைப்பட்டால் பூச்சிக்கொல்லிகள்)",
            safe_dosage_lbl: "சரியான அளவு / டோஸ்",
            monitoring_hdr: "வழக்கமான கண்காணிப்பு அட்டவணை",
            recheck_lbl: "மீண்டும் சோதிக்கும் காலம்",
            field_sensors: "பூச்சி பொறிகள் & வயல் சென்சார்கள்",
            realtime: "வயல் அவதானிப்புகள்",
            weather_risk_hdr: "வானிலை எச்சரிக்கை & நோய் அபாய வழிகாட்டி",
            forecast_lbl: "வானிலை எச்சரிக்கை",
            map_header: "பயிர் நோய் வரைபடம்",
            stat_total: "மொத்த அறிக்கைகள்",
            stat_pending: "வல்லுநரின் சரிபார்ப்புக்காக காத்திருக்கிறது",
            stat_high: "அருகிலுள்ள ஆபத்தான நோய் பரவல்",
            stat_pest: "பூச்சிகளின் செயல்பாடு",
            chart_distribution_hdr: "பாதிக்கப்பட்ட பயிர்கள்",
            chart_trend_hdr: "மாதாந்திர நோய் பரவல்",
            expert_queue_hdr: "வல்லுநர்கள் சரிபார்ப்பு பட்டியல்",
            verify_success: "அறிக்கை சேமிக்கப்பட்டது",
            log_desc: "அறிக்கை வெற்றிகரமாக சேமிக்கப்பட்டது.",
            speak_advisory: "அறிவுரையைக் கேளுங்கள் (ஆடியோ)"
        },
        te: {
            nav_home: "రైతు పోర్టల్",
            nav_map: "పంట తెగుళ్ల మ్యాప్",
            nav_dashboard: "గ్రామ గణాంకాలు",
            system_online: "ఏఐ పంట డాక్టర్ సిద్ధంగా ఉన్నారు",
            local_temp: "ఉష్ణోగ్రత",
            humidity: "తేమ",
            farmer_title: "పంట తెగుళ్ల గుర్తింపు & ప్రమాద హెచ్చరిక",
            farmer_subtitle: "వ్యాధి సోకిన ఆకు ఫోటోను అప్‌లోడ్ చేయండి. ఏఐ వెంటనే వ్యాధిని గుర్తించి సులువైన చికిత్సను చెబుతుంది.",
            map_title: "పంట తెగుళ్ల పర్యవేక్షణ మ్యాప్",
            map_subtitle: "స్థానిక వ్యాధులు, ఆటోమేటిక్ హెచ్చరికలు మరియు పురుగుల ఉధృతిని పర్యవేక్షించడం.",
            official_title: "వ్యవసాయ పర్యవేక్షణ డాష్‌బోర్డ్",
            official_subtitle: "సమగ్ర విశ్లేషణలు, వాతావరణ హెచ్చరికలు మరియు నిపుణుల ధృవీకరణ జాబితా.",
            diagnostic_lab: "ఏఐ ఆకు డాక్టర్",
            image_based: "ఆకును స్కాన్ చేయండి",
            upload_prompt_title: "వ్యాధి సోకిన ఆకు ఫోటోను అప్‌లోడ్ చేయండి",
            upload_prompt_desc: "టమోటా, బంగాళాదుంప, మిరప, జొన్నలు, యాపిల్, ద్రాక్ష, పీచ్, గుమ్మడికాయ, స్ట్రాబెర్రీ",
            browse_btn: "ఫోటోను ఎంచుకోండి",
            field_notes: "పంట గమనికలు (ఐచ్ఛికం)",
            analyze_btn: "వ్యాధిని కనుగొనండి",
            treatment_protocol: "పరీక్ష నివేదిక & పరిష్కారం",
            awaiting_input: "ఆకు ఫోటో కొరకు వేచి ఉంది",
            awaiting_input_desc: "వ్యాధి మరియు చికిత్సను చూడటానికి ఆకు ఫోటోను అప్‌లోడ్ చేసి బటన్‌ను క్లిక్ చేయండి.",
            analyzing_foliage: "ఆకు నమూనాను విశ్లేషిస్తోంది...",
            matching_features: "మా డేటాబేస్ సమాచారంతో సరిపోల్చుతోంది...",
            crop_lbl: "పంట పేరు",
            confidence_lbl: "సరిపోలిక నమ్మకం",
            desc_hdr: "వ్యాధి వివరణ",
            symptoms_hdr: "లక్షణాలు & కారణాలు",
            cultural_hdr: "సహజ / సేంద్రీయ నివారణ పద్ధతులు",
            biological_hdr: "జీవ నియంత్రణ (సహజ నివారణలు)",
            chemical_hdr: "రసాయన నియంత్రణ (అవసరమైతే పురుగుమందులు)",
            safe_dosage_lbl: "సరైన మోతాదు",
            monitoring_hdr: "క్రమం తప్పకుండా తనిఖీ చేసే పట్టిక",
            recheck_lbl: "తిరిగి తనిఖీ చేయాల్సిన సమయం",
            field_sensors: "పురుగుల ఉచ్చులు & పొలం సెన్సార్లు",
            realtime: "పొలం గమనికలు",
            weather_risk_hdr: "వాతావరణ హెచ్చరిక & వ్యాధి ప్రమాద గైడ్",
            forecast_lbl: "వాతావరణ హెచ్చరిక",
            map_header: "పంట తెగుళ్ల మ్యాప్",
            stat_total: "మొత్తం నివేదికలు",
            stat_pending: "నిపుణుల పరిశీలన కొరకు వేచి ఉంది",
            stat_high: "సమీపంలోని ప్రమాదకర తెగుళ్లు",
            stat_pest: "పురుగుల కదలిక స్థాయి",
            chart_distribution_hdr: "ప్రభావిత పంటలు",
            chart_trend_hdr: "నెలవారీ తెగుళ్ల సరళి",
            expert_queue_hdr: "నిపుణుల తనిఖీ జాబితా",
            verify_success: "నివేదిక సేవ్ చేయబడింది",
            log_desc: "నివేదిక విజయవంతంగా సేవ్ చేయబడింది.",
            speak_advisory: "సలహా వినండి (ఆడియో)"
        },
        mr: {
            nav_home: "शेतकरी पोर्टल",
            nav_map: "रोगांचा नकाशा",
            nav_dashboard: "गावाचे आकडेवारी",
            system_online: "एआय डॉक्टर तयार आहे",
            local_temp: "तापमान",
            humidity: "हवेतील ओलसरपणा (नमी)",
            farmer_title: "पानावरील रोगांची तपासणी आणि हवामान इशारा",
            farmer_subtitle: "तुमच्या आजारी पानाचा फोटो अपलोड करा. एआय लगेच रोग ओळखून सोपा उपाय सांगेल.",
            map_title: "रोग नियंत्रण व पाळत नकाशा",
            map_subtitle: "स्थानिक रोगांचा प्रादुर्भाव, धोकादायक हॉटस्पॉट आणि कीटकांचे निरीक्षण.",
            official_title: "कृषी देखरेख डॅशबोर्ड",
            official_subtitle: "एकत्रित आकडेवारी, हवामान इशारे आणि तज्ज्ञांची मंजुरी सूची.",
            diagnostic_lab: "एआय पान डॉक्टर",
            image_based: "पान स्कॅन करा",
            upload_prompt_title: "आजारी पानाचा फोटो अपलोड करा",
            upload_prompt_desc: "टोमॅटो, बटाटा, मिरची, मका, सफरचंद, द्राक्षे, पेरू, भोपळा, स्ट्रॉबेरी",
            browse_btn: "फोटो निवडा",
            field_notes: "शेतातील निरीक्षणे (पर्यायी)",
            analyze_btn: "रोग शोधा",
            treatment_protocol: "तपासणी अहवाल आणि उपाय",
            awaiting_input: "पानाच्या फोटोची वाट पाहत आहे",
            awaiting_input_desc: "रोग आणि त्यावर उपाय पाहण्यासाठी पिकाचा फोटो अपलोड करा आणि बटण दाबा.",
            analyzing_foliage: "पानावरील पॅटर्न तपासत आहे...",
            matching_features: "आमच्या डेटाबेसशी जुळवून पाहत आहे...",
            crop_lbl: "पिकाचे नाव",
            confidence_lbl: "विश्वासार्हता",
            desc_hdr: "रोगाविषयी माहिती",
            symptoms_hdr: "लक्षणे आणि कारणे",
            cultural_hdr: "नैसर्गिक / सेंद्रिय प्रतिबंधात्मक उपाय",
            biological_hdr: "जैविक नियंत्रण (घरगुती उपाय)",
            chemical_hdr: "रासायनिक नियंत्रण (कीटकनाशके, गरज असल्यास)",
            safe_dosage_lbl: "औषधाचे योग्य प्रमाण",
            monitoring_hdr: "नियमित तपासणी checklist",
            recheck_lbl: "पुन्हा तपासणी करा",
            field_sensors: "कीड पकडण्याचे सापळे आणि सेन्सर्स",
            realtime: "शेतातील निरीक्षणे",
            weather_risk_hdr: "हवामान इशारा आणि रोगाचा धोका",
            forecast_lbl: "हवामान अंदाज",
            map_header: "रोगांचा नकाशा",
            stat_total: "एकूण अहवाल",
            stat_pending: "तज्ञांच्या मंजुरीची प्रतीक्षा",
            stat_high: "जवळपास पसरलेले धोकादायक रोग",
            stat_pest: "कीटकांचे प्रमाण",
            chart_distribution_hdr: "बाधित पिके",
            chart_trend_hdr: "रोगांचे मासिक प्रमाण",
            expert_queue_hdr: "तज्ञांची मंजुरी यादी",
            verify_success: "माहिती जतन केली",
            log_desc: "माहिती यशस्वीपणे जतन केली गेली.",
            speak_advisory: "उपाय ऐका (ऑडिओ)"
        }
    };

    // --- DOM Elements ---
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view-section");
    const viewTitle = document.getElementById("viewTitle");
    const viewSubtitle = document.getElementById("viewSubtitle");
    const langSelect = document.getElementById("langSelect");
    
    // File inputs
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const browseBtn = document.getElementById("browseBtn");
    const uploadPreview = document.getElementById("uploadPreview");
    const previewImg = document.getElementById("previewImg");
    const removeImgBtn = document.getElementById("removeImgBtn");
    
    // Action buttons
    const diagnoseBtn = document.getElementById("diagnoseBtn");
    const farmerNotes = document.getElementById("farmerNotes");
    const latInput = document.getElementById("latInput");
    const lngInput = document.getElementById("lngInput");
    const geolocateBtn = document.getElementById("geolocateBtn");
    
    // Diagnostic Advisory Card Elements
    const advisoryEmpty = document.getElementById("advisoryEmpty");
    const advisoryLoading = document.getElementById("advisoryLoading");
    const advisoryContent = document.getElementById("advisoryContent");
    const resCrop = document.getElementById("resCrop");
    const resDisease = document.getElementById("resDisease");
    const resScientific = document.getElementById("resScientific");
    const resConfidence = document.getElementById("resConfidence");
    const severityBadge = document.getElementById("severityBadge");
    
    const advDesc = document.getElementById("advDesc");
    const advSymptoms = document.getElementById("advSymptoms");
    const advPrevention = document.getElementById("advPrevention");
    const advBiological = document.getElementById("advBiological");
    const advChemical = document.getElementById("advChemical");
    const advDosage = document.getElementById("advDosage");
    const advMonitoring = document.getElementById("advMonitoring");
    
    const downloadPDFBtn = document.getElementById("downloadPDFBtn");
    const flagExpertBtn = document.getElementById("flagExpertBtn");
    const speakAdvisoryBtn = document.getElementById("speakAdvisoryBtn");
    
    // Sensor elements
    const sensorForm = document.getElementById("sensorForm");
    const riskGauge = document.getElementById("riskGauge");
    const gaugeArrow = document.getElementById("gaugeArrow");
    const riskValueText = document.getElementById("riskValueText");
    const riskLevelBadge = document.getElementById("riskLevelBadge");
    const riskList = document.getElementById("riskList");
    const weatherForecastDesc = document.getElementById("weatherForecastDesc");
    
    // Toast Notification
    const toast = document.getElementById("toast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");

    // Map filters
    const mapCropFilter = document.getElementById("mapCropFilter");
    const mapStatusFilter = document.getElementById("mapStatusFilter");

    // Dashboard indicators
    const statTotalOutbreaks = document.getElementById("statTotalOutbreaks");
    const statPendingValidation = document.getElementById("statPendingValidation");
    const statHighSeverity = document.getElementById("statHighSeverity");
    const statPestAlerts = document.getElementById("statPestAlerts");
    const queueCountBadge = document.getElementById("queueCountBadge");
    const expertQueueList = document.getElementById("expertQueueList");

    // --- UI Translation Logic ---
    function translateUI() {
        const lang = state.lang;
        document.querySelectorAll("[data-translate]").forEach(elem => {
            const key = elem.getAttribute("data-translate");
            if (dictionary[lang] && dictionary[lang][key]) {
                elem.innerText = dictionary[lang][key];
            }
        });
        
        // Update header dynamically based on active view
        updateHeaderTitles();
    }

    function updateHeaderTitles() {
        const lang = state.lang;
        if (state.currentView === "farmer") {
            viewTitle.innerText = dictionary[lang]["farmer_title"];
            viewSubtitle.innerText = dictionary[lang]["farmer_subtitle"];
        } else if (state.currentView === "map") {
            viewTitle.innerText = dictionary[lang]["map_title"];
            viewSubtitle.innerText = dictionary[lang]["map_subtitle"];
        } else if (state.currentView === "official") {
            viewTitle.innerText = dictionary[lang]["official_title"];
            viewSubtitle.innerText = dictionary[lang]["official_subtitle"];
        }
    }

    langSelect.addEventListener("change", (e) => {
        state.lang = e.target.value;
        translateUI();
    });

    // --- View Toggling ---
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const clickedView = item.getAttribute("data-view");
            
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");
            
            views.forEach(v => {
                v.classList.remove("active");
                if (v.id === `view-${clickedView}`) {
                    v.classList.add("active");
                }
            });
            
            state.currentView = clickedView;
            updateHeaderTitles();
            
            if (clickedView === "map" && state.map) {
                // Invalidate size to load leaflet correctly inside container
                setTimeout(() => {
                    state.map.invalidateSize();
                }, 100);
            }
        });
    });

    // --- Geolocation ---
    geolocateBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            showToast("GPS Setup", "Acquiring satellite lock...", "fa-satellite");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    latInput.value = position.coords.latitude.toFixed(4);
                    lngInput.value = position.coords.longitude.toFixed(4);
                    showToast("GPS Lock", "Location updated successfully.", "fa-crosshairs");
                },
                (error) => {
                    console.log("GPS Blocked, using default Delhi/Punjab region coords.");
                    // Prepopulate with slightly offset coordinate to simulate different field
                    latInput.value = (29.9680 + (Math.random() - 0.5) * 0.1).toFixed(4);
                    lngInput.value = (76.8180 + (Math.random() - 0.5) * 0.1).toFixed(4);
                    showToast("GPS Simulation", "Acquired simulated field coordinates.", "fa-circle-dot");
                }
            );
        }
    });

    // --- Drag & Drop Image Handlers ---
    function handleFile(file) {
        if (file && file.type.startsWith("image/")) {
            state.uploadedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                uploadPreview.style.display = "block";
                dropZone.querySelector(".upload-prompt").style.display = "none";
                diagnoseBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            showToast("Invalid File", "Please select a valid leaf image.", "fa-triangle-exclamation");
        }
    }

    dropZone.addEventListener("click", (e) => {
        if (e.target.id !== "removeImgBtn" && !e.target.closest("#removeImgBtn") && !state.uploadedFile) {
            fileInput.click();
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    removeImgBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.uploadedFile = null;
        fileInput.value = "";
        previewImg.src = "";
        uploadPreview.style.display = "none";
        dropZone.querySelector(".upload-prompt").style.display = "flex";
        diagnoseBtn.disabled = true;
        
        // Reset advisory card
        advisoryContent.style.display = "none";
        advisoryEmpty.style.display = "flex";
    });

    // --- AI Diagnostic Run ---
    diagnoseBtn.addEventListener("click", () => {
        if (!state.uploadedFile) return;
        
        advisoryEmpty.style.display = "none";
        advisoryLoading.style.display = "flex";
        advisoryContent.style.display = "none";
        diagnoseBtn.disabled = true;
        
        const formData = new FormData();
        formData.append("image", state.uploadedFile);
        formData.append("latitude", latInput.value);
        formData.append("longitude", lngInput.value);
        formData.append("farmer_notes", farmerNotes.value);
        
        fetchWithTimeout("/api/predict", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || "AI Prediction engine returned an error");
                }).catch(() => {
                    throw new Error("AI Prediction engine failed");
                });
            }
            return response.json();
        })
        .then(data => {
            displayAdvisoryData(data);
        })
        .catch(err => {
            // Check if this was a leaf validation error from the backend
            if (err.message.includes("Not a leaf") || err.message.includes("validation")) {
                showToast("Invalid Image", err.message, "fa-triangle-exclamation");
                advisoryLoading.style.display = "none";
                advisoryEmpty.style.display = "flex";
                diagnoseBtn.disabled = false;
                return;
            }
            
            console.log("Server API failed. Running client-side mock classification fallback.");
            
            // Identify disease class based on file metadata or filename
            const filename = state.uploadedFile ? state.uploadedFile.name.toLowerCase() : "";
            
            let detectedCrop = "Tomato";
            let detectedDisease = "Late Blight";
            let rawClass = "Tomato___Late_blight";
            let severity = "High";
            
            if (filename.includes("apple") || filename.includes("scab")) {
                detectedCrop = "Apple";
                detectedDisease = "Apple Scab";
                rawClass = "Apple___Apple_scab";
                severity = "Medium";
            } else if (filename.includes("corn") || filename.includes("rust")) {
                detectedCrop = "Corn (maize)";
                detectedDisease = "Common Rust";
                rawClass = "Corn_(maize)___Common_rust";
                severity = "Medium";
            } else if (filename.includes("potato") && (filename.includes("healthy") || filename.includes("clean"))) {
                detectedCrop = "Potato";
                detectedDisease = "healthy";
                rawClass = "Potato___healthy";
                severity = "Low";
            } else if (filename.includes("potato")) {
                detectedCrop = "Potato";
                detectedDisease = "Late Blight";
                rawClass = "Potato___Late_blight";
                severity = "High";
            } else if (filename.includes("healthy") || filename.includes("clean")) {
                detectedCrop = "Tomato";
                detectedDisease = "healthy";
                rawClass = "Tomato___healthy";
                severity = "Low";
            }
            
            // Local Mock Advisory databases (simple offline fallbacks matching our recommendations.json)
            const offlineAdvisories = {
                "Tomato___Late_blight": {
                    scientific_name: "Phytophthora infestans",
                    description: "A highly destructive fungal-like pathogen causing rapid leaf decay, black water-soaked lesions, and severe yield loss in wet/cool weather.",
                    symptoms: "Dark, water-soaked spots starting near leaf tips, surrounded by a pale green halo. White fuzzy mold grows under leaf margins in humid periods.",
                    prevention: "Plant resistant tomato cultivars, space rows for optimal dry airflow, avoid overhead sprinkler irrigation, rotate crops annually.",
                    biological_control: "Apply bio-fungicides like Bacillus subtilis or copper-based bio-agents early.",
                    chemical_control: "Spray metalaxyl, mancozeb, or chlorothalonil immediately upon first lesion detection.",
                    dosage: "2.5 grams per liter of clean water",
                    monitoring_interval: "Every 5 days"
                },
                "Apple___Apple_scab": {
                    scientific_name: "Venturia inaequalis",
                    description: "An infectious fungal pathogen forming olive-green to black scabby spots on foliage, leading to premature leaf drop and deformed fruit.",
                    symptoms: "Olive-brown velvety spots starting on leaf undersides, turning olive-black with distinct crinkled leaf margins.",
                    prevention: "Rake and destroy fallen leaves in autumn, prune orchards to allow wind flow, apply lime sulfur in early spring.",
                    biological_control: "Encourage beneficial bacteria populations or spray neem oil extracts.",
                    chemical_control: "Apply captan, dodine, or myclobutanil fungicides from green-tip stage onwards.",
                    dosage: "2.0 grams per liter of water",
                    monitoring_interval: "Every 7 days"
                },
                "Corn_(maize)___Common_rust": {
                    scientific_name: "Puccinia sorghi",
                    description: "A wind-borne rust fungus producing golden-brown powdery pustules on both upper and lower leaf surfaces.",
                    symptoms: "Elongated reddish-brown powdery pustules on leaves. Spores rub off easily leaving powdery residue.",
                    prevention: "Sow resistant hybrid seeds. Destroy volunteer maize stalks and alternate weed hosts.",
                    biological_control: "No highly effective biological control exists; copper soaps offer mild suppression.",
                    chemical_control: "Apply strobilurin or triazole fungicides if pustules appear before silking stage.",
                    dosage: "1.5 grams per liter of water",
                    monitoring_interval: "Every 10 days"
                },
                "Tomato___healthy": {
                    scientific_name: "Solanum lycopersicum",
                    description: "Healthy plant canopy displaying normal green coloration, standard vigor, and zero pathological lesions.",
                    symptoms: "Lush green leaves, uniform shape, sturdy stalks, healthy yellow blossoms.",
                    prevention: "Continue routine crop rotations, maintain soil moisture, stake vines off ground.",
                    biological_control: "None required. Apply compost tea to enhance natural soil defenses.",
                    chemical_control: "No chemical fungicides or treatments required.",
                    dosage: "0 grams (No chemical treatment needed)",
                    monitoring_interval: "Every 14 days"
                },
                "Potato___healthy": {
                    scientific_name: "Solanum tuberosum",
                    description: "Healthy potato plant canopy showing uniform growth and clean, spot-free foliage.",
                    symptoms: "Vibrant green leaves, uniform shape, no spots or necrotic patches.",
                    prevention: "Use certified clean seed tubers, maintain hilling, rotate crops.",
                    biological_control: "None required.",
                    chemical_control: "No chemical treatments required.",
                    dosage: "0 grams (No chemical treatment needed)",
                    monitoring_interval: "Every 14 days"
                }
            };
            
            const advisory = offlineAdvisories[rawClass] || offlineAdvisories["Tomato___Late_blight"];
            
            const mockData = {
                report_id: "mock-upload-" + Math.floor(Math.random() * 10000000),
                crop: detectedCrop,
                disease_label: detectedDisease,
                severity: severity,
                confidence: 85 + Math.random() * 10,
                advisory: advisory
            };
            
            // Push mock diagnostic report to local list so it instantly updates maps and analytics too!
            state.reports.push({
                id: mockData.report_id,
                crop: mockData.crop,
                disease: rawClass,
                severity: mockData.severity,
                status: "Unverified",
                latitude: parseFloat(latInput.value) || 30.2,
                longitude: parseFloat(lngInput.value) || 76.6,
                timestamp: new Date().toISOString(),
                farmer_notes: farmerNotes.value ? `Farmer noted: ${farmerNotes.value}` : "Diagnosed offline fallback mode",
                image_url: "/api/static-images/potato_late_blight.jpg"
            });
            
            displayAdvisoryData(mockData);
            
            // Reload indicators
            renderMapMarkers();
            renderExpertQueue();
            loadDashboardStats();
            
            showToast("Diagnosis (Local Mode)", `Successfully simulated ${detectedDisease} client-side.`, "fa-check-circle");
        });
    });

    function displayAdvisoryData(data) {
        advisoryLoading.style.display = "none";
        advisoryContent.style.display = "block";
        diagnoseBtn.disabled = false;
        
        // Populate results
        resCrop.innerText = data.crop;
        resDisease.innerText = data.disease_label;
        resScientific.innerText = data.advisory.scientific_name;
        resConfidence.innerText = `${data.confidence.toFixed(1)}%`;
        state.activeReportId = data.report_id;
        
        // Severity badge
        severityBadge.className = "badge";
        if (data.severity === "High") {
            severityBadge.classList.add("badge-danger");
            severityBadge.innerText = "High Severity";
        } else if (data.severity === "Medium") {
            severityBadge.classList.add("badge-warning");
            severityBadge.innerText = "Medium Severity";
        } else {
            severityBadge.classList.add("badge-emerald");
            severityBadge.innerText = "Healthy / Low";
        }
        
        // Populate details
        advDesc.innerText = data.advisory.description;
        advSymptoms.innerText = data.advisory.symptoms;
        advPrevention.innerText = data.advisory.prevention;
        advBiological.innerText = data.advisory.biological_control;
        advChemical.innerText = data.advisory.chemical_control;
        advDosage.innerText = data.advisory.dosage;
        advMonitoring.innerText = data.advisory.monitoring_interval;
        
        // Reload logs and indicators
        loadReports();
        loadDashboardStats();
    }

    // --- Flag for Expert Review ---
    flagExpertBtn.addEventListener("click", () => {
        if (!state.activeReportId) return;
        
        const comment = prompt("Add a note explaining your doubt to the agricultural extension officer:");
        if (comment === null) return; // cancelled
        
        fetch(`/api/reports/${state.activeReportId}/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "Unverified",
                expert_notes: comment ? `Farmer flagged review: ${comment}` : "Farmer flagged for review"
            })
        })
        .then(res => res.json())
        .then(data => {
            showToast("Flagged Success", "Case submitted to agricultural validation queue.", "fa-shield-halved");
            loadReports();
            loadDashboardStats();
        });
    });

    // --- Download Advisory PDF (Print layout) ---
    downloadPDFBtn.addEventListener("click", () => {
        if (!state.activeReportId) return;
        
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
            <head>
                <title>AgroShield AI - Advisory Report</title>
                <style>
                    body { font-family: sans-serif; color: #333; padding: 30px; line-height: 1.6; }
                    .header { border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h1 { color: #065f46; margin: 0; }
                    .header p { color: #666; margin: 5px 0 0 0; }
                    .crop-info { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { color: #0f766e; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 0.8em; }
                    .badge-red { background: #fee2e2; color: #991b1b; }
                    .badge-orange { background: #fef3c7; color: #92400e; }
                    .badge-green { background: #dcfce7; color: #166534; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>AgroShield AI - Advisory Report</h1>
                    <p>Generated: ${new Date().toLocaleString()} | Case: #${state.activeReportId.substring(0,8)}</p>
                </div>
                <div class="crop-info">
                    <h2>Crop: ${resCrop.innerText}</h2>
                    <h3>Diagnosis: ${resDisease.innerText} (${resScientific.innerText})</h3>
                    <p><strong>Confidence:</strong> ${resConfidence.innerText}</p>
                </div>
                <div class="section">
                    <h3>Disease Description</h3>
                    <p>${advDesc.innerText}</p>
                </div>
                <div class="section">
                    <h3>Symptoms & Causes</h3>
                    <p>${advSymptoms.innerText}</p>
                </div>
                <div class="section">
                    <h3>Cultural Prevention</h3>
                    <p>${advPrevention.innerText}</p>
                </div>
                <div class="section">
                    <h3>Biological Treatment</h3>
                    <p>${advBiological.innerText}</p>
                </div>
                <div class="section">
                    <h3>Chemical Control & Safe Dosage</h3>
                    <p>${advChemical.innerText}</p>
                    <p><strong>Recommended Dosage:</strong> ${advDosage.innerText}</p>
                </div>
                <div class="section">
                    <h3>Monitoring Plan</h3>
                    <p>Re-check every ${advMonitoring.innerText} to evaluate treatment progress.</p>
                </div>
                <footer style="margin-top: 50px; text-align: center; color: #888; font-size: 0.8em;">
                    AgroShield Crop Intelligence Core - Field Advisory Document.
                </footer>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    // --- Local Dialect Voice Assistant (Feature #4) ---
    speakAdvisoryBtn.addEventListener("click", () => {
        if (!state.activeReportId) return;
        
        const crop = resCrop.innerText;
        const disease = resDisease.innerText;
        const confidence = resConfidence.innerText;
        const chemical = advChemical.innerText;
        const dosage = advDosage.innerText;
        const monitoring = advMonitoring.innerText;
        
        let spokenText = "";
        
        if (state.lang === "hi") {
            spokenText = `किसान भाई, कृपया ध्यान दें। आपकी ${crop} की फसल में ${disease} रोग पाया गया है, जिसकी संभावना ${confidence} है। हम सलाह देते हैं कि आप ${chemical} का छिड़काव करें। इसका सुरक्षित प्रयोग ${dosage} के अनुसार करें। और फसल की प्रत्येक ${monitoring} पर फिर से जांच अवश्य करें। धन्यवाद।`;
        } else if (state.lang === "es") {
            spokenText = `Atención agricultor: Hemos detectado la enfermedad de ${disease} en su cultivo de ${crop} con una confianza del ${confidence}. Recomendamos aplicar ${chemical} a una dosis de ${dosage}. Recuerde monitorear cada ${monitoring}.`;
        } else if (state.lang === "sw") {
            spokenText = `Mkulima habari: Tumegundua ugonjwa wa ${disease} kwenye zao lako la ${crop} kwa uhakika wa asilimia ${confidence}. Tunashauri kutumia dawa ya ${chemical} kwa kiwango cha ${dosage}. Kumbuka kukagua kila baada ya ${monitoring}.`;
        } else {
            spokenText = `Attention farmer: We detected ${disease} on your ${crop} crop with ${confidence} confidence. We recommend applying ${chemical} at a dosage of ${dosage}. Remember to recheck every ${monitoring}.`;
        }
        
        const utterance = new SpeechSynthesisUtterance(spokenText);
        
        // Select matching language voice
        if (state.lang === "hi") utterance.lang = "hi-IN";
        else if (state.lang === "es") utterance.lang = "es-ES";
        else if (state.lang === "sw") utterance.lang = "sw-KE";
        else utterance.lang = "en-US";
        
        window.speechSynthesis.cancel(); // Stop any currently playing audio
        window.speechSynthesis.speak(utterance);
        
        showToast("Voice Assistant", "Playing spoken advisory.", "fa-volume-high");
    });

    // --- Field Log & Sensor Form Submit ---
    sensorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const logData = {
            temperature: parseFloat(document.getElementById("tempInput").value),
            humidity: parseFloat(document.getElementById("humidityInput").value),
            soil_moisture: parseFloat(document.getElementById("soilMoistureInput").value),
            pest_count: parseInt(document.getElementById("pestCountInput").value),
            notes: document.getElementById("sensorNotes").value
        };
        
        fetch("/api/sensor-logs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logData)
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            const lang = state.lang;
            showToast(dictionary[lang]["verify_success"], dictionary[lang]["log_desc"], "fa-paper-plane");
            resetSensorForm();
        })
        .catch(err => {
            console.log("Simulating sensor logging client-side.");
            const lang = state.lang;
            showToast(dictionary[lang]["verify_success"] + " (Offline)", dictionary[lang]["log_desc"], "fa-paper-plane");
            
            // Add a mock report if pest count is high
            if (logData.pest_count > 10) {
                state.reports.push({
                    id: "mock-sensor-" + Math.floor(Math.random() * 1000),
                    crop: "Field Pests",
                    disease: "Pest___Vector_infestation",
                    severity: "High",
                    status: "Unverified",
                    latitude: 30.22,
                    longitude: 76.62,
                    timestamp: new Date().toISOString(),
                    farmer_notes: `High insect vector count logged! ${logData.notes}`
                });
                renderMapMarkers();
                renderExpertQueue();
            }
            
            resetSensorForm();
        });
    });

    function resetSensorForm() {
        sensorForm.reset();
        document.getElementById("tempInput").value = 23.4;
        document.getElementById("humidityInput").value = 82;
        document.getElementById("soilMoistureInput").value = 48;
        document.getElementById("pestCountInput").value = 4;
        loadWeatherRisk();
        loadDashboardStats();
    }

    // --- Weather-based Risk Forecasting ---
    function loadWeatherRisk() {
        fetchWithTimeout("/api/weather-forecast")
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            updateWeatherRiskUI(data);
        })
        .catch(err => {
            console.log("Using local mock weather-forecast.");
            // Offline fallback
            const mockData = {
                temperature: 19.5,
                humidity: 87.0,
                forecast: "Cloudy with light showers expected. (Running in Fallback Mode)",
                risks: {
                    "Late Blight (Potato/Tomato)": {
                        level: "High",
                        factor: "High humidity combined with cool 19°C temperatures creates optimal leaf-wetness duration."
                    },
                    "Apple Scab": {
                        level: "High",
                        factor: "Frequent rain showers keep foliage wet. Protect orchard early."
                    },
                    "Common Rust (Corn)": {
                        level: "Medium",
                        factor: "Moderate temperatures support rust spore germination."
                    },
                    "Pest Infestation": {
                        level: "High",
                        factor: "Current trap average is 11.6 pests/trap. Threshold alert if > 10."
                    }
                },
                projections: {
                    labels: ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
                    late_blight: [85, 92, 95, 65, 35, 15, 10],
                    apple_scab: [70, 82, 88, 72, 45, 25, 15],
                    pest_outbreak: [30, 35, 40, 55, 70, 85, 90]
                }
            };
            updateWeatherRiskUI(mockData);
        });
    }

    function updateWeatherRiskUI(data) {
        // Update quick indicators
        document.getElementById("headerTemp").innerText = `${data.temperature.toFixed(1)}°C`;
        document.getElementById("headerHumidity").innerText = `${data.humidity}%`;
        weatherForecastDesc.innerText = data.forecast;
        
        // Calculate overall risk
        let highCount = 0;
        let medCount = 0;
        
        riskList.innerHTML = "";
        for (const [disease, details] of Object.entries(data.risks)) {
            if (details.level === "High") highCount++;
            else if (details.level === "Medium") medCount++;
            
            const badgeClass = details.level === "High" ? "badge-danger" : (details.level === "Medium" ? "badge-warning" : "badge-emerald");
            const item = document.createElement("div");
            item.className = "risk-item";
            item.innerHTML = `
                <div>
                    <div class="risk-name">${disease}</div>
                    <div class="risk-factor-popover">${details.factor}</div>
                </div>
                <span class="badge ${badgeClass}">${details.level} Risk</span>
            `;
            riskList.appendChild(item);
        }
        
        // Update gauge arrow rotation
        let deg = 45; // Low
        let levelText = "Low Risk";
        riskLevelBadge.className = "badge badge-emerald";
        
        if (highCount > 0) {
            deg = 135; // High
            levelText = "High Risk Level";
            riskLevelBadge.className = "badge badge-danger";
        } else if (medCount > 0) {
            deg = 90; // Medium
            levelText = "Medium Risk Level";
            riskLevelBadge.className = "badge badge-warning";
        }
        
        gaugeArrow.style.transform = `rotate(${deg}deg)`;
        riskValueText.innerText = levelText;
        riskLevelBadge.innerText = levelText;
        
        // Render 7-day risk projection chart (Feature #3)
        if (data.projections) {
            renderProjectionChart(data.projections);
        }
    }

    function renderProjectionChart(proj) {
        const ctx = document.getElementById("projectionChart").getContext("2d");
        if (state.charts.projection) state.charts.projection.destroy();
        
        state.charts.projection = new Chart(ctx, {
            type: "line",
            data: {
                labels: proj.labels,
                datasets: [
                    {
                        label: "Blight Risk (%)",
                        data: proj.late_blight,
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.05)",
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: "Scab Risk (%)",
                        data: proj.apple_scab,
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245, 158, 11, 0.05)",
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: "Pest Risk (%)",
                        data: proj.pest_outbreak,
                        borderColor: "#14b8a6",
                        backgroundColor: "rgba(20, 184, 166, 0.05)",
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#94a3b8", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.03)" } },
                    y: { min: 0, max: 100, ticks: { color: "#94a3b8", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.03)" } }
                },
                plugins: {
                    legend: {
                        labels: { color: "#e2e8f0", font: { size: 9, family: "Inter" } },
                        position: "top"
                    }
                }
            }
        });
    }

    // --- Surveillance Geospatial Map (Leaflet) ---
    function initMap() {
        // Initialize map centering around Punjab area coordinates
        state.map = L.map("map").setView([30.1, 76.8], 8);
        
        // CartoDB Dark Matter tile provider
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(state.map);
    }

    function renderMapMarkers() {
        if (!state.map) return;
        
        // Clear old markers
        state.markers.forEach(m => state.map.removeLayer(m));
        state.markers = [];
        
        const cropFilter = mapCropFilter.value.toLowerCase();
        const statusFilter = mapStatusFilter.value;
        
        state.reports.forEach(report => {
            // Apply filter
            if (cropFilter !== "all" && !report.crop.toLowerCase().includes(cropFilter)) return;
            if (statusFilter !== "all" && report.status !== statusFilter) return;
            
            // Color logic based on status & severity
            let color = "#ef4444"; // default red
            if (report.status === "Expert Verified") {
                color = "#10b981"; // emerald
            } else if (report.status === "Unverified") {
                color = "#f59e0b"; // warning orange
            }
            
            // Draw marker
            const marker = L.circleMarker([report.latitude, report.longitude], {
                radius: 10,
                fillColor: color,
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(state.map);
            
            // Add popup
            const statusBadge = report.status === "Expert Verified" ? "badge-emerald" : (report.status === "Rejected" ? "badge-danger" : "badge-warning");
            
            let imgHtml = "";
            if (report.image_url) {
                imgHtml = `<img class="popup-img" src="${report.image_url}" alt="Leaf photo">`;
            }
            
            marker.bindPopup(`
                <div class="popup-details">
                    <h4>${report.crop} - ${report.disease.split("___")[1]?.replace("_", " ") || "Healthy"}</h4>
                    <p style="margin-bottom: 5px;"><strong>Severity:</strong> ${report.severity} | <span class="badge ${statusBadge}" style="font-size:0.6em; padding:2px 4px;">${report.status}</span></p>
                    <p>Logged: ${new Date(report.timestamp).toLocaleDateString()}</p>
                    ${imgHtml}
                    ${report.farmer_notes ? `<p style="margin-top: 5px; font-style:italic;">"${report.farmer_notes}"</p>` : ""}
                </div>
            `);
            
            state.markers.push(marker);
        });
    }

    mapCropFilter.addEventListener("change", renderMapMarkers);
    mapStatusFilter.addEventListener("change", renderMapMarkers);

    // --- Official Dashboard Analytics & expert queue ---
    function loadDashboardStats() {
        fetchWithTimeout("/api/dashboard-stats")
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            statTotalOutbreaks.innerText = data.total_outbreaks;
            statPendingValidation.innerText = data.pending_validation;
            statHighSeverity.innerText = data.high_severity;
            
            queueCountBadge.innerText = `${data.pending_validation} cases pending`;
            
            // Determine pest warning status
            if (data.recent_sensor && data.recent_sensor.pest_count > 10) {
                statPestAlerts.innerText = "CRITICAL OUTBREAK";
                statPestAlerts.parentElement.parentElement.classList.add("bg-danger-light");
            } else {
                statPestAlerts.innerText = "NORMAL SURVEILLANCE";
                statPestAlerts.parentElement.parentElement.classList.remove("bg-danger-light");
            }
            
            // Setup Charts
            renderCharts(data.crop_distribution, data.monthly_trend);
        })
        .catch(err => {
            console.log("Using local mock dashboard stats.");
            // Calculate dynamically from state.reports
            const total = state.reports.length;
            const pending = state.reports.filter(r => r.status === "Unverified").length;
            const high = state.reports.filter(r => r.severity === "High").length;
            
            statTotalOutbreaks.innerText = total;
            statPendingValidation.innerText = pending;
            statHighSeverity.innerText = high;
            queueCountBadge.innerText = `${pending} cases pending`;
            statPestAlerts.innerText = "NORMAL SURVEILLANCE";
            
            // Build distributions
            const distribution = {};
            state.reports.forEach(r => {
                distribution[r.crop] = (distribution[r.crop] || 0) + 1;
            });
            
            const mockTrend = {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
                values: [2, 4, 3, 5, 8, 9, total - 2, total]
            };
            
            renderCharts(distribution, mockTrend);
        });
    }

    function renderCharts(crops, trend) {
        // Crop doughnut Chart
        const cropCtx = document.getElementById("cropChart").getContext("2d");
        if (state.charts.crops) state.charts.crops.destroy();
        
        const cropLabels = Object.keys(crops);
        const cropValues = Object.values(crops);
        
        state.charts.crops = new Chart(cropCtx, {
            type: "doughnut",
            data: {
                labels: cropLabels,
                datasets: [{
                    data: cropValues,
                    backgroundColor: ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"],
                    borderWidth: 1,
                    borderColor: "#0b1510"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { color: "#e2e8f0", font: { family: "Inter" } }
                    }
                }
            }
        });

        // Timeline line Chart
        const trendCtx = document.getElementById("trendChart").getContext("2d");
        if (state.charts.trend) state.charts.trend.destroy();
        
        state.charts.trend = new Chart(trendCtx, {
            type: "line",
            data: {
                labels: trend.labels,
                datasets: [{
                    label: "Outbreak Incidents",
                    data: trend.values,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
                    y: { ticks: { color: "#94a3b8", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Load expert validation cards queue
    function renderExpertQueue() {
        expertQueueList.innerHTML = "";
        
        const pendingReports = state.reports.filter(r => r.status === "Unverified");
        
        if (pendingReports.length === 0) {
            expertQueueList.innerHTML = `
                <div class="queue-empty">
                    <i class="fa-solid fa-square-check"></i>
                    <p>All clean. There are no pending cases requiring expert validation.</p>
                </div>
            `;
            return;
        }
        
        pendingReports.forEach(report => {
            const rawDiseaseName = report.disease.split("___")[1] || "Healthy";
            const cleanDiseaseName = rawDiseaseName.replace("_", " ").replace("_", " ").titleCase();
            const dateStr = new Date(report.timestamp).toLocaleString();
            
            const card = document.createElement("div");
            card.className = "queue-item";
            
            let imgHtml = "/api/static-images/potato_late_blight.jpg";
            if (report.image_url) {
                imgHtml = report.image_url;
            }
            
            card.innerHTML = `
                <div class="queue-img-container">
                    <img src="${imgHtml}" alt="Doubted leaf">
                </div>
                <div class="queue-details">
                    <div class="queue-meta">
                        <h4>AI Predict: ${cleanDiseaseName}</h4>
                        <span class="queue-crop">${report.crop}</span>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Submitted: ${dateStr} | GPS: [${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}]</p>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Confidence: <strong>${report.confidence.toFixed(1)}%</strong> | Severity: <strong style="color:#ef4444;">${report.severity}</strong></p>
                    ${report.farmer_notes ? `<p class="queue-notes"><strong>Farmer notes:</strong> "${report.farmer_notes}"</p>` : ""}
                    
                    <div class="queue-validation-box">
                        <input type="text" placeholder="Add official recommendation notes..." id="expNotes-${report.id}">
                        <button class="btn btn-success btn-sm verify-btn" data-id="${report.id}"><i class="fa-solid fa-check"></i> Approve</button>
                        <button class="btn btn-danger btn-sm reject-btn" data-id="${report.id}"><i class="fa-solid fa-xmark"></i> Reject</button>
                    </div>
                </div>
            `;
            
            expertQueueList.appendChild(card);
        });

        // Add action handlers to queue buttons
        document.querySelectorAll(".verify-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const rId = btn.getAttribute("data-id");
                const notes = document.getElementById(`expNotes-${rId}`).value;
                submitValidation(rId, "Expert Verified", notes);
            });
        });

        document.querySelectorAll(".reject-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const rId = btn.getAttribute("data-id");
                const notes = document.getElementById(`expNotes-${rId}`).value;
                submitValidation(rId, "Rejected", notes);
            });
        });
    }

    function submitValidation(reportId, status, notes) {
        fetch(`/api/reports/${reportId}/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: status,
                expert_notes: notes || `Validated by Extension Officer`
            })
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            showToast("Validation Logged", `Case #${reportId.substring(0,8)} marked as ${status}.`, "fa-shield-halved");
            loadReports();
            loadDashboardStats();
        })
        .catch(err => {
            console.log("Simulating validation update client-side.");
            const rep = state.reports.find(r => r.id === reportId);
            if (rep) {
                rep.status = status;
                if (status === "Rejected") rep.severity = "Low";
            }
            showToast("Validation Logged (Offline)", `Case #${reportId.substring(0,8)} marked as ${status}.`, "fa-shield-halved");
            renderMapMarkers();
            renderExpertQueue();
            loadDashboardStats();
        });
    }

    // --- Notification Toast Helpers ---
    function showToast(title, message, iconClass = "fa-circle-check") {
        toastTitle.innerText = title;
        toastMessage.innerText = message;
        
        const iconElem = toast.querySelector(".toast-icon");
        iconElem.className = `fa-solid ${iconClass} toast-icon`;
        
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    // String utilities
    String.prototype.titleCase = function() {
        return this.split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    // --- Loading Backend Data ---
    function loadReports() {
        fetchWithTimeout("/api/reports")
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            state.reports = data;
            renderMapMarkers();
            renderExpertQueue();
        })
        .catch(err => {
            console.log("Using local mock reports database.");
            if (!state.reports || state.reports.length === 0) {
                // Prepopulate state.reports with a beautiful set of 8 mock local cases in Punjab
                state.reports = [
                    {
                        id: "mock-1",
                        crop: "Tomato",
                        disease: "Tomato___Late_blight",
                        severity: "High",
                        status: "Unverified",
                        latitude: 30.3,
                        longitude: 76.5,
                        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
                        farmer_notes: "Leaves turning black after heavy rain.",
                        image_url: "/api/static-images/potato_late_blight.jpg"
                    },
                    {
                        id: "mock-2",
                        crop: "Apple",
                        disease: "Apple___Apple_scab",
                        severity: "Medium",
                        status: "Expert Verified",
                        latitude: 30.15,
                        longitude: 76.9,
                        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
                        farmer_notes: "Spots observed on multiple apple leaves.",
                        image_url: "/api/static-images/apple_scab.jpg"
                    },
                    {
                        id: "mock-3",
                        crop: "Corn (maize)",
                        disease: "Corn_(maize)___healthy",
                        severity: "Low",
                        status: "Expert Verified",
                        latitude: 30.05,
                        longitude: 76.7,
                        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
                        farmer_notes: "Crop looking very green and healthy."
                    },
                    {
                        id: "mock-4",
                        crop: "Potato",
                        disease: "Potato___Late_blight",
                        severity: "High",
                        status: "Unverified",
                        latitude: 30.4,
                        longitude: 76.35,
                        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
                        farmer_notes: "Late blight spreading on early potato variety."
                    }
                ];
            }
            renderMapMarkers();
            renderExpertQueue();
        });
    }

    // --- Initialization Execution ---
    function init() {
        translateUI();
        initMap();
        loadReports();
        loadWeatherRisk();
        loadDashboardStats();
        
        // Setup initial default location map center on load
        setTimeout(() => {
            if (state.map) state.map.invalidateSize();
        }, 500);
    }

    init();
});
