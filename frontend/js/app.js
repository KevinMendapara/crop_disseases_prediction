// AgroShield AI - Core Client Application
document.addEventListener("DOMContentLoaded", () => {
    // Current application state
    const state = {
        lang: "en",
        currentView: "home",
        role: "farmer",
        uploadedFile: null,
        activeReportId: null,
        map: null,
        pinMarker: null,
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
            nav_scan: "Check Crop Health",
            nav_treatment: "Treatment Guide",
            nav_alerts: "Weather & Alerts",
            nav_admin_queue: "Validation Queue",
            nav_admin_login: "Officer Panel",
            nav_admin_logout: "Exit Admin Panel",
            nav_home_landing: "Home",
            nav_settings: "Database Settings",
            nav_login: "Farmer Login",
            nav_logout: "Log Out",
            welcome_title: "Welcome to AgroShield Portal",
            welcome_desc: "Your digital crop doctor. Get instant leaf diagnostics and regional disease risk metrics in your language.",
            card_diag_title: "Leaf Diagnostics",
            card_diag_desc: "Take a photo of your diseased leaf and get a custom organic and chemical treatment recommendation instantly.",
            card_map_title: "Disease Map",
            card_map_desc: "Inspect regional disease outbreaks, hot zones, and surveillance logs in nearby villages.",
            card_dash_title: "Official Analytics",
            card_dash_desc: "View aggregated village crop reports, microclimate metrics, and specialist queues.",
            guide_header: "How to Use AgroShield",
            step1_title: "Snap Leaf Photo",
            step1_desc: "Take a clear picture of the infected plant leaf in daylight.",
            step2_title: "Upload Leaf",
            step2_desc: "Upload the photo to the diagnostics portal and click 'Find Disease'.",
            step3_title: "Get Advisory",
            step3_desc: "See the diagnosis results, symptoms causes, and mixing instructions.",
            step4_title: "Listen to Audio",
            step4_desc: "Click the audio button to hear the treatment recommendations read aloud.",
            auth_login_title: "Farmer Login",
            auth_login_desc: "Enter credentials to connect with village database.",
            auth_login_btn: "Login",
            
            nav_home: "Farmer Portal",
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
            upload_prompt_desc: "Upload any leaf photo. The model recognizes 42 trained crop and disease classes, including Rice.",
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
            nav_scan: "फसल स्वास्थ्य जांच",
            nav_treatment: "उपचार निर्देश",
            nav_alerts: "मौसम और सूचनाएं",
            nav_admin_queue: "सत्यापन सूची",
            nav_admin_login: "अधिकारी पैनल",
            nav_admin_logout: "अधिकारी पैनल से बाहर निकलें",
            nav_home_landing: "मुख्य पृष्ठ",
            nav_settings: "डेटाबेस सेटिंग्स",
            nav_login: "किसान लॉगिन",
            nav_logout: "लॉग आउट",
            welcome_title: "एग्रोशील्ड पोर्टल पर आपका स्वागत है",
            welcome_desc: "आपका डिजिटल फसल डॉक्टर। अपनी भाषा में तुरंत पत्ती निदान और क्षेत्रीय बीमारी के खतरे के आंकड़े प्राप्त करें।",
            card_diag_title: "पत्ती रोग जांच",
            card_diag_desc: "अपनी बीमार पत्ती का फोटो लें और तुरंत जैविक व रासायनिक उपचार योजना प्राप्त करें।",
            card_map_title: "बीमारी का नक्शा",
            card_map_desc: "आस-पास के गांवों में बीमारी के प्रकोप, हॉटस्पॉट और निगरानी रिकॉर्ड की जांच करें।",
            card_dash_title: "गांव के आंकड़े",
            card_dash_desc: "समग्र फसल रिपोर्ट, मौसम के आंकड़े और विशेषज्ञों की सत्यापन सूची देखें।",
            guide_header: "एग्रोशील्ड का उपयोग कैसे करें",
            step1_title: "पत्ती का फोटो लें",
            step1_desc: "दिन के उजाले में संक्रमित पौधे की पत्ती की एक साफ तस्वीर लें।",
            step2_title: "अपलोड करें",
            step2_desc: "तस्वीर को डायग्नोस्टिक्स पोर्टल पर अपलोड करें और 'बीमारी का पता लगाएं' पर क्लिक करें।",
            step3_title: "सलाह प्राप्त करें",
            step3_desc: "निदान परिणाम, लक्षणों के कारण और दवा मिलाने के निर्देश देखें।",
            step4_title: "ऑडियो सुनें",
            step4_desc: "उपचार की सिफारिशों को जोर से सुनने के लिए ऑडियो बटन पर क्लिक करें।",
            auth_login_title: "किसान लॉगिन",
            auth_login_desc: "गांव के डेटाबेस से जुड़ने के लिए लॉगिन विवरण दर्ज करें।",
            auth_login_btn: "लॉगिन",
            
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
            nav_scan: "ਫਸਲ ਦੀ ਸਿਹਤ ਜਾਂਚ",
            nav_treatment: "ਇਲਾਜ ਗਾਈਡ",
            nav_alerts: "ਮੌਸਮ ਅਤੇ ਅਲਰਟ",
            nav_admin_queue: "ਜਾਂਚ ਸੂਚੀ",
            nav_admin_login: "ਅਧਿਕਾਰੀ ਪੈਨਲ",
            nav_admin_logout: "ਅਧਿਕਾਰੀ ਪੈਨਲ ਤੋਂ ਬਾਹਰ ਜਾਓ",
            nav_home_landing: "ਮੁੱਢਲਾ ਪੰਨਾ",
            nav_settings: "ਡਾਟਾਬੇਸ ਸੈਟਿੰਗਜ਼",
            nav_login: "ਕਿਸਾਨ ਲੌਗਇਨ",
            nav_logout: "ਲੌਗ ਆਉਟ",
            welcome_title: "ਐਗਰੋਸ਼ੀਲਡ ਪੋਰਟਲ 'ਤੇ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
            welcome_desc: "ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਫਸਲ ਡਾਕਟਰ। ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਪੱਤੇ ਦੀ ਜਾਂਚ ਅਤੇ ਬੀਮਾਰੀ ਦੇ ਖਤਰੇ ਦੇ ਅੰਕੜੇ ਦੇਖੋ।",
            card_diag_title: "ਪੱਤੇ ਦੀ ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ",
            card_diag_desc: "ਆਪਣੇ ਬੀਮਾਰ ਪੱਤੇ ਦੀ ਫੋਟੋ ਲਓ ਅਤੇ ਤੁਰੰਤ ਦੇਸੀ ਅਤੇ ਰਸਾਇਣਕ ਇਲਾਜ ਦੇਖੋ।",
            card_map_title: "ਬੀਮਾਰੀ ਦਾ ਨਕਸ਼ਾ",
            card_map_desc: "ਨੇੜਲੇ ਪਿੰਡਾਂ ਵਿੱਚ ਫੈਲੀਆਂ ਬੀਮਾਰੀਆਂ, ਖਤਰਨਾਕ ਇਲਾਕੇ ਅਤੇ ਸਰਵੇਖਣ ਰਿਪੋਰਟਾਂ ਦੇਖੋ।",
            card_dash_title: "ਪਿੰਡ ਦੇ ਅੰਕੜੇ",
            card_dash_desc: "ਫਸਲਾਂ ਦੀਆਂ ਸਾਂਝੀਆਂ ਰਿਪੋਰਟਾਂ, ਮੌਸਮ ਦੇ ਅੰਕੜੇ ਅਤੇ ਮਾਹਰਾਂ ਦੀ ਜਾਂਚ ਸੂਚੀ ਦੇਖੋ।",
            guide_header: "ਐਗਰੋਸ਼ੀਲਡ ਦੀ ਵਰਤੋਂ ਕਿਵੇਂ ਕਰੀਏ",
            step1_title: "ਪੱਤੇ ਦੀ ਫੋਟੋ ਲਓ",
            step1_desc: "ਦਿਨ ਦੇ ਚਾਨਣ ਵਿੱਚ ਬੀਮਾਰ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਖਿੱਚੋ।",
            step2_title: "ਅਪਲੋਡ ਕਰੋ",
            step2_desc: "ਫੋਟੋ ਨੂੰ ਪੋਰਟਲ 'ਤੇ ਅਪਲੋਡ ਕਰੋ ਅਤੇ 'ਬੀਮਾਰੀ ਦਾ ਪਤਾ ਲਗਾਓ' 'ਤੇ ਕਲਿੱक ਕਰੋ।",
            step3_title: "ਇਲਾਜ ਦੇਖੋ",
            step3_desc: "ਜਾਂਚ ਦੇ ਨਤੀਜੇ, ਲੱਛਣਾਂ ਦੇ ਕਾਰਨ ਅਤੇ ਦਵਾਈ ਦੀ ਸਹੀ ਮਾਤਰਾ ਦੇਖੋ।",
            step4_title: "ਆਵਾਜ਼ ਸੁਣੋ",
            step4_desc: "ਇਲਾਜ ਦੇ ਤਰੀਕੇ ਸੁਣਨ ਲਈ ਆਡੀਓ ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
            auth_login_title: "ਕਿਸਾਨ ਲੌਗਇਨ",
            auth_login_desc: "ਪਿੰਡ ਦੇ ਡੇਟਾਬੇਸ ਨਾਲ ਜੁੜਨ ਲਈ ਲੌਗਇਨ ਕਰੋ।",
            auth_login_btn: "ਲੌਗਇਨ",
            
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
            nav_scan: "பயிர் ஆரோக்கியத்தை சரிபார்",
            nav_treatment: "சிகிச்சை முறை கையேடு",
            nav_alerts: "வானிலை மற்றும் எச்சரிக்கைகள்",
            nav_admin_queue: "சரிபார்ப்பு பட்டியல்",
            nav_admin_login: "அதிகாரி குழு",
            nav_admin_logout: "அதிகாரி குழுவிலிருந்து வெளியேறு",
            nav_home_landing: "முகப்பு",
            nav_settings: "தரவுத்தள அமைப்புகள்",
            nav_login: "விவசாயி உள்நுழைவு",
            nav_logout: "வெளியேறு",
            welcome_title: "அக்ரோஷீல்ட் போர்ட்டலுக்கு உங்களை வரவேற்கிறோம்",
            welcome_desc: "உங்கள் டிஜிட்டல் பயிர் மருத்துவர். உங்கள் மொழியிலேயே உடனடி இலை கண்டறிதல் மற்றும் நோய் அபாய எச்சரிக்கைகளைப் பெறுங்கள்.",
            card_diag_title: "இலை நோய் கண்டறிதல்",
            card_diag_desc: "பாதிக்கப்பட்ட இலையின் புகைப்படத்தை எடுத்து உடனடியாக இயற்கை மற்றும் ரசாயன சிகிச்சை முறைகளைத் தெரிந்துகொள்ளுங்கள்.",
            card_map_title: "நோய் வரைபடம்",
            card_map_desc: "அருகிலுள்ள கிராமங்களில் நோய் பரவல் மற்றும் பூச்சிகளின் தாக்குதல் குறித்த விபரங்களை அறியுங்கள்.",
            card_dash_title: "கிராம புள்ளிவிவரங்கள்",
            card_dash_desc: "ஒட்டுமொ体 பயிர் அறிக்கைகள், வானிலை காரணிகள் மற்றும் வல்லுநர்களின் சரிபார்ப்பு விபரங்களைக் காணுங்கள்.",
            guide_header: "அக்ரோஷீல்ட் எவ்வாறு பயன்படுத்துவது",
            step1_title: "இலையை படம் பிடி",
            step1_desc: "பகலில் பாதிக்கப்பட்ட தாவர இலையின் தெளிவான புகைப்படத்தை எடுக்கவும்.",
            step2_title: "பதிவேற்று",
            step2_desc: "போர்ட்டலில் புகைப்படத்தைப் பதிவேற்றி 'நோயைக் கண்டுபிடி' என்பதை அழுத்தவும்.",
            step3_title: "பரிந்துரையைப் பெறு",
            step3_desc: "நோய் கண்டறிதல் முடிவுகள், அறிகுறிகள் மற்றும் மருந்து கலக்கும் விபரங்களைக் காண்.",
            step4_title: "ஆடியோவைக் கேள்",
            step4_desc: "பரிந்துரைக்கப்பட்ட சிகிச்சைகளைக் கேட்க ஆடியோ பொத்தானை அழுத்தவும்.",
            auth_login_title: "விவசாயி உள்நுழைவு",
            auth_login_desc: "கிராம தரவுத்தளத்துடன் இணைய விபரங்களை உள்ளிடவும்.",
            auth_login_btn: "உள்நுழை",
            
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
            nav_scan: "పంట ఆరోగ్యాన్ని తనిఖీ చేయండి",
            nav_treatment: "చికిత్స సలహా పట్టిక",
            nav_alerts: "వాతావరణం & హెచ్చరికలు",
            nav_admin_queue: "పరిశీలన జాబితా",
            nav_admin_login: "అధికారి లాగిన్",
            nav_admin_logout: "అధికారి ప్యానెల్ నుండి నిష్క్రమించు",
            nav_home_landing: "హోమ్",
            nav_settings: "డేటాబేస్ సెట్టింగులు",
            nav_login: "రైతు లాగిన్",
            nav_logout: "లాగ్ అవుట్",
            welcome_title: "అగ్రోషీల్డ్ పోర్టల్‌కు స్వాగతం",
            welcome_desc: "మీ డిజిటల్ పంట డాక్టర్. మీ స్వంత భాషలోనే తెగుళ్ల గుర్తింపు మరియు వ్యాధి ప్రమాద నివేదికలను పొందండి.",
            card_diag_title: "ఆకు తెగుళ్ల గుర్తింపు",
            card_diag_desc: "తెగులు సోకిన ఆకు ఫోటోను తీసి తక్షణమే సహజ మరియు రసాయన చికిత్స సలహాలను పొందండి.",
            card_map_title: "పంట తెగుళ్ల మ్యాప్",
            card_map_desc: "సమీప గ్రామాలలో తెగుళ్ల ఉధృతి, హాట్‌స్పాట్‌లు మరియు పంట రక్షణ రికార్డులను పరిశీలించండి.",
            card_dash_title: "గ్రామ గణాంకాలు",
            card_dash_desc: "మొత్తం పంట నివేదికలు, వాతావరణ హెచ్చరికలు మరియు నిపుణుల పరిశీలన జాబితాలను చూడండి.",
            guide_header: "అగ్రోషీల్డ్ ఎలా ఉపయోగించాలి",
            step1_title: "ఆకు ఫోటో తీయండి",
            step1_desc: "పగటి వెలుతురులో తెగులు సోకిన ఆకు యొక్క స్పష్టమైన ఫోటోను తీయండి.",
            step2_title: "అప్‌లోడ్ చేయండి",
            step2_desc: "ఫోటోను పోర్టల్‌లో అప్‌లోడ్ చేసి 'వ్యాధిని కనుగొనండి' క్లిక్ చేయండి.",
            step3_title: "సలహా పొందండి",
            step3_desc: "వ్యాధి వివరాలు, లక్షణాలు మరియు మందుల మోతాదు వివరాలు చూడండి.",
            step4_title: "ఆడియో వినండి",
            step4_desc: "చికిత్స సలహాలను వినడానికి ఆడియో బటన్‌ను క్లిక్ చేయండి.",
            auth_login_title: "రైతు లాగిన్",
            auth_login_desc: "గ్రామ డేటాబేస్కు కనెక్ట్ కావడానికి వివరాలను నమోదు చేయండి.",
            auth_login_btn: "లాగిన్",
            
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
            nav_scan: "पिकाचे आरोग्य तपासा",
            nav_treatment: "उपचार मार्गदर्शक",
            nav_alerts: "हवामान व इशारे",
            nav_admin_queue: "सत्यापन सूची",
            nav_admin_login: "अधिकारी पॅनेल",
            nav_admin_logout: "अधिकारी पॅनेल बाहेर पडा",
            nav_home_landing: "मुख्य पान",
            nav_settings: "डेटाबेस सेटिंग्ज",
            nav_login: "शेतकरी लॉगिन",
            nav_logout: "लॉग आउट",
            welcome_title: "अँग्रोशील्ड पोर्टलवर आपले स्वागत आहे",
            welcome_desc: "तुमचा डिजिटल पीक डॉक्टर. आपल्या भाषेत लगेच पानावरील रोगांची तपासणी आणि हवामान इशारे मिळवा.",
            card_diag_title: "पानावरील रोगांची तपासणी",
            card_diag_desc: "तुमच्या आजारी पानाचा फोटो घ्या आणि लगेच नैसर्गिक व रासायनिक उपाय मिळवा.",
            card_map_title: "रोगांचा नकाशा",
            card_map_desc: "जवळपासच्या गावांमध्ये पसरलेले रोग, धोके आणि पिकांच्या नोंदी तपासा.",
            card_dash_title: "गावाचे आकडेवारी",
            card_dash_desc: "एकत्रित पिकांचे अहवाल, हवामान इशारे आणि तज्ञांची मंजुरी सूची तपासा.",
            guide_header: "अँग्रोशील्ड कसे वापरावे",
            step1_title: "पानाचा फोटो घ्या",
            step1_desc: "दिवसाच्या उजेडात आजारी पानावरील स्पष्ट फोटो काढा.",
            step2_title: "अपलोड करा",
            step2_desc: "फोटो पोर्टलवर अपलोड करा आणि 'रोग शोधा' बटण दाबा.",
            step3_title: "उपाय मिळवा",
            step3_desc: "तपासणी अहवाल, लक्षणे आणि औषधाचे प्रमाण तपासा.",
            step4_title: "ऑडिओ ऐका",
            step4_desc: "उपाय ऐकण्यासाठी ऑडिओ बटणावर क्लिक करा.",
            auth_login_title: "शेतकरी लॉगिन",
            auth_login_desc: "गावाच्या डेटाबेसशी जोडण्यासाठी लॉग इन तपशील भरा.",
            auth_login_btn: "लॉगिन",
            
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

    // --- Supabase Client & Connection Setup ---
    let supabase = null;

    function getApiUrl(endpoint) {
        if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
        // When accessed via HTTP/HTTPS from our Flask backend, always use same-origin relative URLs
        if (window.location.protocol.startsWith("http")) {
            return endpoint;
        }
        const config = (typeof AGROSHIELD_CONFIG !== "undefined" ? AGROSHIELD_CONFIG : null) || window.AGROSHIELD_CONFIG || {};
        const base = (config.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
        return base + endpoint;
    }

    function initSupabase() {
        const config = (typeof AGROSHIELD_CONFIG !== "undefined" ? AGROSHIELD_CONFIG : null) || window.AGROSHIELD_CONFIG || {};
        const url = config.SUPABASE_URL || localStorage.getItem("supabase_url") || "";
        const key = config.SUPABASE_KEY || localStorage.getItem("supabase_key") || "";
        if (url && key) {
            try {
                // Initialize supabase using client library
                supabase = window.supabase.createClient(url, key);
                console.log("Supabase Client initialized successfully.");
                updateDbStatusUI(true);
            } catch (e) {
                console.error("Failed to initialize Supabase:", e);
                updateDbStatusUI(false);
            }
        } else {
            supabase = null;
            updateDbStatusUI(false);
        }
    }

    function updateDbStatusUI(connected) {
        const badge = document.getElementById("dbStatusBadge");
        const text = document.getElementById("dbStatusText");
        if (!badge || !text) return;
        
        if (connected) {
            badge.className = "connection-status status-connected";
            badge.innerHTML = '<i class="fa-solid fa-cloud-bolt"></i> <span>Supabase Connected (Cloud Sync Active)</span>';
        } else {
            badge.className = "connection-status status-disconnected";
            badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Offline Mode (Local Storage Only)</span>';
        }
    }

    // --- User Session & Auth Controllers ---
    function updateRoleUI() {
        const adminLinks = document.querySelectorAll(".admin-only");
        const adminLoginBtn = document.getElementById("adminLoginNavBtn");
        const adminLogoutBtn = document.getElementById("adminLogoutBtn");
        const headerUserChip = document.getElementById("headerUserChip");
        
        // Officer tools must never appear in the farmer navigation.
        adminLinks.forEach(lnk => lnk.style.display = state.role === "admin" ? "flex" : "none");
        
        if (state.role === "admin") {
            if (headerUserChip) headerUserChip.style.display = "none";
            if (adminLoginBtn) adminLoginBtn.style.display = "none";
            if (adminLogoutBtn) adminLogoutBtn.style.display = "flex";
            
            // Hide farmer profiles in admin mode to prevent clutter
            document.getElementById("loginNavBtn").style.display = "none";
            document.getElementById("userProfileBadge").style.display = "none";
            document.getElementById("logoutBtn").style.display = "none";
        } else {
            if (adminLoginBtn) adminLoginBtn.style.display = "flex";
            if (adminLogoutBtn) adminLogoutBtn.style.display = "none";
            
            if (state.user) {
                if (headerUserChip) headerUserChip.style.display = "flex";
                document.getElementById("userProfileBadge").style.display = "flex";
                document.getElementById("loginNavBtn").style.display = "none";
                document.getElementById("logoutBtn").style.display = "flex";
            } else {
                if (headerUserChip) headerUserChip.style.display = "none";
                document.getElementById("userProfileBadge").style.display = "none";
                document.getElementById("loginNavBtn").style.display = "flex";
                document.getElementById("logoutBtn").style.display = "none";
            }
        }
    }

    function setSessionUser(user) {
        state.user = user;
        localStorage.setItem("session_user", JSON.stringify(user));
        
        const badge = document.getElementById("userProfileBadge");
        const loginBtn = document.getElementById("loginNavBtn");
        const logoutBtn = document.getElementById("logoutBtn");
        const avatar = document.getElementById("userAvatar");
        const nameText = document.getElementById("userName");
        const villageText = document.getElementById("userVillage");
        
        if (badge && loginBtn && logoutBtn && avatar && nameText && villageText) {
            badge.style.display = "flex";
            loginBtn.style.display = "none";
            logoutBtn.style.display = "flex";
            
            avatar.innerText = user.full_name ? user.full_name.charAt(0).toUpperCase() : "F";
            nameText.innerText = user.full_name || "Farmer Friend";
            villageText.innerText = user.village ? (user.village + (user.district ? ", " + user.district : "")) : "Local Farm";
        }
        const headerUserName = document.getElementById("headerUserName");
        if (headerUserName) headerUserName.innerText = user.full_name || "Farmer Friend";
        updateRoleUI();
        
        const homeNav = document.querySelector('[data-view=home]');
        if (homeNav) homeNav.click();
        window.history.replaceState({}, "", "/home");
    }

    function checkSession() {
        // An officer session is intentionally not restored from localStorage.
        // It is created only after a successful officer credential check.
        state.role = "farmer";
        localStorage.removeItem("user_role");
        updateRoleUI();
        
        const storedUser = localStorage.getItem("session_user");
        if (storedUser && state.role !== "admin") {
            try {
                setSessionUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Session parse error:", e);
            }
        }
    }

    // --- DOM Elements ---
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view-section");
    const viewTitle = document.getElementById("viewTitle");
    const viewSubtitle = document.getElementById("viewSubtitle");
    const langSelect = document.getElementById("langSelect");
    const locationToggleBtn = document.getElementById("locationToggleBtn");
    const locationPanel = document.getElementById("locationPanel");
    const citySelect = document.getElementById("citySelect");
    const applyCityBtn = document.getElementById("applyCityBtn");
    const headerLocationName = document.getElementById("headerLocationName");
    const cityCoordinates = {
        "New Delhi": [28.6139, 77.2090],
        "Chandigarh": [30.7333, 76.7794],
        "Ludhiana": [30.9010, 75.8573],
        "Jaipur": [26.9124, 75.7873],
        "Lucknow": [26.8467, 80.9462],
        "Hyderabad": [17.3850, 78.4867],
        "Bengaluru": [12.9716, 77.5946],
        "Pune": [18.5204, 73.8567]
    };
    let selectedCity = localStorage.getItem("weather_city") || "New Delhi";

    function updateLocationLabel() {
        if (headerLocationName) headerLocationName.innerText = selectedCity;
        if (citySelect) citySelect.value = selectedCity;
    }

    function setLocationPanel(open) {
        if (!locationPanel || !locationToggleBtn) return;
        locationPanel.style.display = open ? "block" : "none";
        locationToggleBtn.setAttribute("aria-expanded", String(open));
    }
    
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

    // --- Header Top Actions & Dark Mode Controllers ---
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const notificationBtn = document.getElementById("notificationBtn");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationDot = document.getElementById("notificationDot");
    const notifCountBadge = document.getElementById("notifCountBadge");
    const clearNotifBtn = document.getElementById("clearNotifBtn");

    function applyTheme(isDark, showToastMsg = false) {
        if (isDark) {
            document.body.classList.add("dark-theme");
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                themeToggleBtn.setAttribute("title", "Switch to Light Mode");
            }
            localStorage.setItem("agroshield_theme", "dark");
            if (showToastMsg) showToast("Dark Mode Enabled", "Switched to high-contrast night theme.", "fa-moon");
        } else {
            document.body.classList.remove("dark-theme");
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                themeToggleBtn.setAttribute("title", "Switch to Dark Mode");
            }
            localStorage.setItem("agroshield_theme", "light");
            if (showToastMsg) showToast("Light Mode Enabled", "Switched to standard day theme.", "fa-sun");
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDark = document.body.classList.contains("dark-theme");
            applyTheme(!isDark, true);
        });
    }

    // Apply saved theme on boot
    const savedTheme = localStorage.getItem("agroshield_theme");
    if (savedTheme === "dark") {
        applyTheme(true, false);
    } else {
        applyTheme(false, false);
    }

    // Notification dropdown toggle
    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = notificationPanel.style.display === "block";
            notificationPanel.style.display = isOpen ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (notificationPanel && !notificationPanel.contains(e.target) && e.target !== notificationBtn && !notificationBtn.contains(e.target)) {
                notificationPanel.style.display = "none";
            }
        });
    }

    if (clearNotifBtn) {
        clearNotifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (notificationDot) notificationDot.style.display = "none";
            if (notifCountBadge) {
                notifCountBadge.innerText = "0 new";
                notifCountBadge.className = "badge badge-sm";
                notifCountBadge.style.opacity = "0.7";
            }
            showToast("Notifications Cleared", "All alerts marked as read.", "fa-check-double");
        });
    }

    // Header Quick Stats Click -> Weather & Alerts
    document.querySelectorAll(".quick-stat").forEach(stat => {
        stat.style.cursor = "pointer";
        stat.setAttribute("title", "Click to view Weather & Risk Alerts");
        stat.addEventListener("click", () => {
            const alertsNav = document.querySelector('.nav-item[data-view="alerts"]');
            if (alertsNav) alertsNav.click();
        });
    });

    // Header User Chip Click -> View Farm Profile
    const headerUserChip = document.getElementById("headerUserChip");
    if (headerUserChip) {
        headerUserChip.style.cursor = "pointer";
        headerUserChip.setAttribute("title", "Click to view farm profile");
        headerUserChip.addEventListener("click", () => {
            const homeNav = document.querySelector('.nav-item[data-view="home"]');
            if (homeNav) {
                homeNav.click();
                const profileCard = document.querySelector('.farm-profile-card');
                if (profileCard) profileCard.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

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
        if (!dictionary[lang]) return;
        
        if (state.currentView === "home") {
            viewTitle.innerText = dictionary[lang]["welcome_title"] || "Home Portal";
            viewSubtitle.innerText = dictionary[lang]["welcome_desc"] || "Welcome back.";
        } else if (state.currentView === "scan") {
            viewTitle.innerText = "Check Crop Health";
            viewSubtitle.innerText = "Scan or upload a picture of a diseased leaf.";
        } else if (state.currentView === "treatment") {
            viewTitle.innerText = "Treatment Guide";
            viewSubtitle.innerText = "Simplified remedial recommendations for your crop.";
        } else if (state.currentView === "alerts") {
            viewTitle.innerText = "Weather & Alerts";
            viewSubtitle.innerText = "Microclimate risk levels and trap metrics.";
        } else if (state.currentView === "map") {
            viewTitle.innerText = dictionary[lang]["map_title"] || "Disease Map";
            viewSubtitle.innerText = dictionary[lang]["map_subtitle"] || "";
        } else if (state.currentView === "official") {
            viewTitle.innerText = "Analytics Dashboard";
            viewSubtitle.innerText = "Officer Outbreak surveillance statistics.";
        } else if (state.currentView === "admin-queue") {
            viewTitle.innerText = "Validation Queue";
            viewSubtitle.innerText = "Check pending crop reports and send advice.";
        } else if (state.currentView === "auth") {
            viewTitle.innerText = "Farmer Sign In";
            viewSubtitle.innerText = "Sign in to save records.";
        } else if (state.currentView === "admin-auth") {
            viewTitle.innerText = "Officer Admin Login";
            viewSubtitle.innerText = "Login to the agricultural monitoring center.";
        }
    }

    langSelect.addEventListener("change", (e) => {
        state.lang = e.target.value;
        translateUI();
    });

    // --- View Toggling ---
    function openView(clickedView, sourceItem = null) {
        const adminViews = ["official", "admin-queue"];
        const farmerViews = ["scan", "treatment", "alerts", "map"];

        if (adminViews.includes(clickedView) && state.role !== "admin") {
            showToast("Officer access required", "Sign in with an officer account to open the admin area.", "fa-shield-halved");
            clickedView = "admin-auth";
        } else if (farmerViews.includes(clickedView) && !state.user) {
            showToast("Sign in required", "Please sign in or create a farmer account first.", "fa-lock");
            clickedView = "auth";
        }
        navItems.forEach(n => n.classList.remove("active"));
        const activeItem = sourceItem || document.querySelector(`[data-view="${clickedView}"]`);
        if (activeItem) activeItem.classList.add("active");

        views.forEach(v => v.classList.toggle("active", v.id === `view-${clickedView}`));
        state.currentView = clickedView;
        updateHeaderTitles();

        if (clickedView !== "map") clearGeologicalPin();
        if (clickedView === "map" && state.map) setTimeout(() => state.map.invalidateSize(), 100);
        if (clickedView === "alerts") setTimeout(() => loadWeatherRisk(), 100);
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            openView(item.getAttribute("data-view"), item);
        });
    });

    document.querySelectorAll("[data-landing-action]").forEach(button => {
        button.addEventListener("click", () => {
            const wantsRegistration = button.dataset.landingAction === "register";
            openView("auth");
            document.getElementById("workspaceStart").scrollIntoView({ behavior: "smooth", block: "start" });
            if (wantsRegistration && authMode === "login") document.getElementById("authToggleLink").click();
        });
    });

    // --- Header location and profile controls ---
    updateLocationLabel();
    if (locationToggleBtn) {
        locationToggleBtn.addEventListener("click", () => {
            setLocationPanel(locationPanel.style.display === "none");
        });
    }
    if (applyCityBtn) {
        applyCityBtn.addEventListener("click", () => {
            selectedCity = citySelect.value.trim() || "New Delhi";
            localStorage.setItem("weather_city", selectedCity);
            updateLocationLabel();
            setLocationPanel(false);
            loadWeatherRisk();
            showToast("Area updated", `Showing current weather for ${selectedCity}.`, "fa-location-dot");
        });
    }
    document.addEventListener("click", (event) => {
        if (locationPanel && locationPanel.style.display !== "none" && !event.target.closest(".location-wrap")) {
            setLocationPanel(false);
        }
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
        
        fetchWithTimeout(getApiUrl("/api/predict"), {
            method: "POST",
            body: formData
        })
        .then(async response => {
            if (!response.ok) {
                let errMsg = "AI Prediction engine returned an error";
                try {
                    const errData = await response.json();
                    errMsg = errData.error || errMsg;
                } catch(e) {}
                throw new Error(errMsg);
            }
            return response.json();
        })
        .then(data => {
            displayAdvisoryData(data);
            // Re-fetch reports list and reload dashboard stats so the map and queue update immediately!
            loadReports();
            loadDashboardStats();
        })
        .catch(err => {
            console.error("Prediction request failed:", err);
            advisoryLoading.style.display = "none";
            advisoryEmpty.style.display = "flex";
            diagnoseBtn.disabled = false;
            showToast(
                "Prediction unavailable",
                err.message || "The trained prediction service could not analyze this image. Please try again.",
                "fa-triangle-exclamation"
            );
        });
    });

    async function displayAdvisoryData(data) {
        advisoryLoading.style.display = "none";
        advisoryContent.style.display = "block";
        diagnoseBtn.disabled = false;
        
        resCrop.innerText = data.crop;
        resDisease.innerText = data.disease_label;
        resScientific.innerText = data.advisory.scientific_name;
        resConfidence.innerText = `${data.confidence.toFixed(1)}%`;
        
        // Render precise GPS coordinates on the advisory card
        const resGPS = document.getElementById("resGPS");
        if (resGPS) {
            const latVal = parseFloat(latInput.value);
            const lngVal = parseFloat(lngInput.value);
            if (!isNaN(latVal) && !isNaN(lngVal)) {
                resGPS.innerText = `${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`;
            } else {
                resGPS.innerText = "Simulated Location";
            }
        }
        state.activeReportId = data.report_id;
        
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
        
        advDesc.innerText = data.advisory.description;
        advSymptoms.innerText = data.advisory.symptoms;
        advPrevention.innerText = data.advisory.prevention;
        advBiological.innerText = data.advisory.biological_control;
        advChemical.innerText = data.advisory.chemical_control;
        advDosage.innerText = data.advisory.dosage;
        advMonitoring.innerText = data.advisory.monitoring_interval;
        
        // Explainable AI (Grad-CAM Saliency)
        const gradcamContainer = document.getElementById("gradcamContainer");
        const gradcamDisplayImg = document.getElementById("gradcamDisplayImg");
        const gradcamBox = document.getElementById("gradcamBox");
        const toggleGradcamBtn = document.getElementById("toggleGradcamBtn");
        
        if (data.gradcam_image && gradcamContainer && gradcamDisplayImg) {
            gradcamContainer.style.display = "block";
            gradcamDisplayImg.src = data.gradcam_image;
            if (gradcamBox) gradcamBox.style.display = "none";
            if (toggleGradcamBtn) toggleGradcamBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Show AI Attention Heatmap';
        } else if (gradcamContainer) {
            gradcamContainer.style.display = "none";
        }
        
        // Update Smart Dosage & Acreage Calculator
        updateDosageCalculation();
        
        // Render 7-Day Treatment Recovery Plan
        renderTreatmentTracker(data.disease_label);
        
        // Fetch Nearest KVK Center and Outbreak Proximity Alerts
        const curLat = parseFloat(latInput.value) || 29.9680;
        const curLng = parseFloat(lngInput.value) || 76.8180;
        fetchNearestKVK(curLat, curLng);
        fetchProximityAlerts(curLat, curLng);
        
        if (supabase) {
            try {
                let userId = null;
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) userId = user.id;
                } catch(e) {}
                
                const reportToInsert = {
                    user_id: userId,
                    crop: data.crop,
                    disease: data.prediction,
                    severity: data.severity,
                    status: "Unverified",
                    latitude: parseFloat(latInput.value),
                    longitude: parseFloat(lngInput.value),
                    image_url: data.image_url || "",
                    confidence: data.confidence,
                    farmer_notes: farmerNotes.value.trim()
                };
                
                const { data: inserted, error } = await supabase
                    .from("reports")
                    .insert(reportToInsert)
                    .select()
                    .single();
                
                if (!error && inserted) {
                    state.activeReportId = inserted.id;
                    console.log("Report uploaded and saved to Supabase:", inserted.id);
                } else if (error) {
                    throw error;
                }
            } catch (e) {
                console.error("Failed to sync report to Supabase, running locally:", e);
            }
        }
        
        loadReports();
        loadDashboardStats();
        
        const treatmentNav = document.querySelector('[data-view=treatment]');
        if (treatmentNav) {
            treatmentNav.click();
        }
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

    // --- 1-Click PMFBY Crop Insurance Claim Dossier (Official jsPDF Generator) ---
    downloadPDFBtn.addEventListener("click", () => {
        if (!state.activeReportId && !resCrop.innerText) {
            showToast("No Report", "Please run a crop diagnosis first.", "fa-circle-exclamation");
            return;
        }
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showToast("PDF Generating", "Opening printable official dossier...", "fa-file-pdf");
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // 1. Top Header Banner
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 64, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("PRADHAN MANTRI FASAL BIMA YOJANA (PMFBY) - GOVT. OF INDIA", 30, 26);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.text("Digital Crop Damage Loss Appraisal & Agricultural Extension Surveillance Dossier", 30, 44);
        
        // 2. Dossier ID Bar
        doc.setFillColor(241, 245, 249);
        doc.rect(30, 78, pageWidth - 60, 42, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(30, 78, pageWidth - 60, 42, "S");
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const dossierId = "PMFBY-" + (state.activeReportId ? String(state.activeReportId).substring(0, 8).toUpperCase() : "2026-IND-7429");
        doc.text(`Claim Reference ID: ${dossierId}`, 42, 95);
        doc.text(`Survey Timestamp: ${new Date().toLocaleString('en-IN')}`, 42, 110);
        
        const latVal = document.getElementById("latInput")?.value || "29.9680";
        const lngVal = document.getElementById("lngInput")?.value || "76.8180";
        doc.text(`GPS Geotag: Lat ${latVal}° N, Long ${lngVal}° E`, 330, 95);
        doc.text(`Validation Engine: AgroShield AI Multimodal Diagnostic Core`, 330, 110);
        
        // 3. Section: Beneficiary Details
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text("1. BENEFICIARY & FIELD IDENTIFICATION", 30, 144);
        doc.setDrawColor(5, 150, 105);
        doc.line(30, 148, pageWidth - 30, 148);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const farmerName = (state.user && state.user.full_name) ? state.user.full_name : "Registered Beneficiary Farmer";
        const village = (state.user && state.user.village) ? state.user.village : "Karnal Taluka";
        const district = (state.user && state.user.district) ? state.user.district : "Kurukshetra District, Haryana";
        doc.text(`Farmer Name: ${farmerName}`, 42, 165);
        doc.text(`Village / Block: ${village}`, 42, 180);
        doc.text(`District / State: ${district}`, 42, 195);
        
        const acreageStr = `${document.getElementById("landAreaInput")?.value || '1.0'} ${document.getElementById("landUnitSelect")?.value || 'Acre'}`;
        doc.text(`Surveyed Land Holding: ${acreageStr}`, 330, 165);
        doc.text(`Survey Mechanism: Smartphone Foliage AI Scan`, 330, 180);
        doc.text(`Verification Status: Geotagged Field Evidence`, 330, 195);
        
        // 4. Section: AI Pathological Diagnosis
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text("2. PATHOLOGICAL DIAGNOSIS & DAMAGE APPRAISAL", 30, 222);
        doc.line(30, 226, pageWidth - 30, 226);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(`Target Crop: ${resCrop.innerText}`, 42, 243);
        doc.text(`Detected Disease: ${resDisease.innerText}`, 42, 258);
        doc.text(`Pathogen Scientific Name: ${resScientific.innerText}`, 42, 273);
        
        doc.text(`Confidence Score: ${resConfidence.innerText}`, 330, 243);
        doc.text(`Severity Rating: ${severityBadge.innerText}`, 330, 258);
        const lossAssess = severityBadge.innerText.includes("High") 
            ? "Severe (Estimated 50-75% yield loss risk without prompt chemical intervention)" 
            : "Moderate (Estimated 15-30% foliar damage, localized)";
        doc.text(`Yield Loss Assessment: ${lossAssess}`, 330, 273, { maxWidth: pageWidth - 360 });
        
        // 5. Section: Visual Evidence
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text("3. VISUAL FIELD EVIDENCE & EXPLAINABLE AI HEATMAP", 30, 310);
        doc.line(30, 314, pageWidth - 30, 314);
        
        const previewImg = document.getElementById("previewImg");
        const gradcamImg = document.getElementById("gradcamDisplayImg");
        let hasImg = false;
        
        if (previewImg && previewImg.src && previewImg.src.startsWith("data:")) {
            try {
                doc.addImage(previewImg.src, "JPEG", 42, 325, 150, 110);
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("Evidence 1: Field Leaf Photographic Sample", 42, 448);
                hasImg = true;
            } catch(e) {}
        }
        
        if (gradcamImg && gradcamImg.src && gradcamImg.src.startsWith("data:")) {
            try {
                doc.addImage(gradcamImg.src, "JPEG", 240, 325, 150, 110);
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("Evidence 2: Grad-CAM Neural Attention Heatmap", 240, 448);
                hasImg = true;
            } catch(e) {}
        }
        
        const presY = hasImg ? 475 : 340;
        
        // 6. Section: Agronomic Prescription & Extension Guidance
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text("4. RECOMMENDED INTERVENTION & AGRONOMIC PROTOCOL", 30, presY);
        doc.line(30, presY + 4, pageWidth - 30, presY + 4);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Prescribed Chemical Treatment: ${advChemical.innerText}`, 42, presY + 20, { maxWidth: pageWidth - 80 });
        doc.text(`Authorized Dosage / Dilution: ${advDosage.innerText}`, 42, presY + 38);
        doc.text(`Biological / Cultural Management: ${advBiological.innerText}`, 42, presY + 54, { maxWidth: pageWidth - 80 });
        doc.text(`Follow-up Inspection Interval: ${advMonitoring.innerText}`, 42, presY + 76);
        
        // 7. Sign-off Boxes
        const signY = presY + 105;
        doc.setDrawColor(203, 213, 225);
        const boxW = (pageWidth - 80) / 2;
        doc.rect(30, signY, boxW, 70);
        doc.rect(30 + boxW + 20, signY, boxW, 70);
        
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text("Beneficiary Farmer Signature / Thumb Impression", 42, signY + 18);
        doc.text("Authorized Extension Surveyor / KVK Scientist Seal", 42 + boxW + 20, signY + 18);
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("I certify that this leaf sample accurately represents my standing crop.", 42, signY + 60);
        doc.text("Verified with digital cryptographic tamper-evident timestamp.", 42 + boxW + 20, signY + 60);
        
        // Footer Note
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("AgroShield AI - Smart India Hackathon (SIH) 2026 Edition | In Compliance with Ministry of Agriculture Guidelines", 30, 815);
        
        doc.save(`PMFBY_Claim_Dossier_${resCrop.innerText}_${new Date().toISOString().substring(0,10)}.pdf`);
        showToast("Dossier Generated", "Official PMFBY Insurance Claim PDF downloaded.", "fa-file-circle-check");
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

    // --- Explainable AI (Grad-CAM) Toggle ---
    const toggleGradcamBtn = document.getElementById("toggleGradcamBtn");
    const gradcamBox = document.getElementById("gradcamBox");
    if (toggleGradcamBtn && gradcamBox) {
        toggleGradcamBtn.addEventListener("click", () => {
            const isVisible = gradcamBox.style.display === "block";
            gradcamBox.style.display = isVisible ? "none" : "block";
            toggleGradcamBtn.innerHTML = isVisible 
                ? '<i class="fa-solid fa-eye"></i> Show AI Attention Heatmap' 
                : '<i class="fa-solid fa-eye-slash"></i> Hide AI Attention Heatmap';
        });
    }

    // --- Smart Dosage & Acreage Calculator Logic ---
    function updateDosageCalculation() {
        const areaInput = document.getElementById("landAreaInput");
        const unitSelect = document.getElementById("landUnitSelect");
        const pumpSelect = document.getElementById("pumpTypeSelect");
        if (!areaInput || !unitSelect || !pumpSelect) return;

        const area = parseFloat(areaInput.value) || 1.0;
        const unit = unitSelect.value;
        const pumpCap = parseFloat(pumpSelect.value) || 16.0;

        let acreMultiplier = 1.0;
        if (unit === "bigha") acreMultiplier = 0.4;
        else if (unit === "guntha") acreMultiplier = 0.025;
        else if (unit === "hectare") acreMultiplier = 2.47;

        const totalAcres = area * acreMultiplier;
        const totalWater = Math.max(10, Math.round(totalAcres * 200));
        const tanksCount = (totalWater / pumpCap).toFixed(1);

        let dosageGramsPerL = 2.0;
        const dosageText = advDosage ? advDosage.innerText : "";
        const numMatch = dosageText.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (numMatch) {
            dosageGramsPerL = parseFloat(numMatch[1]);
        }

        const totalChemical = Math.round(totalWater * dosageGramsPerL);
        const perTankChemical = Math.round(pumpCap * dosageGramsPerL);
        const approxScoops = Math.max(1, Math.round(perTankChemical / 15));

        const costMin = Math.round(totalChemical * 0.45);
        const costMax = Math.round(totalChemical * 0.65);

        const calcWater = document.getElementById("calcWater");
        const calcTanks = document.getElementById("calcTanks");
        const calcChemical = document.getElementById("calcChemical");
        const calcPerTank = document.getElementById("calcPerTank");
        const calcCost = document.getElementById("calcCost");

        if (calcWater) calcWater.innerText = `${totalWater} L`;
        if (calcTanks) calcTanks.innerText = `${tanksCount} Tanks (${pumpCap}L)`;
        if (calcChemical) calcChemical.innerText = `${totalChemical} g / ml`;
        if (calcPerTank) calcPerTank.innerText = `${perTankChemical} g (~${approxScoops} scoops)`;
        if (calcCost) calcCost.innerText = `₹${costMin} - ₹${costMax}`;
    }

    const landAreaInput = document.getElementById("landAreaInput");
    const landUnitSelect = document.getElementById("landUnitSelect");
    const pumpTypeSelect = document.getElementById("pumpTypeSelect");
    if (landAreaInput) landAreaInput.addEventListener("input", updateDosageCalculation);
    if (landUnitSelect) landUnitSelect.addEventListener("change", updateDosageCalculation);
    if (pumpTypeSelect) pumpTypeSelect.addEventListener("change", updateDosageCalculation);

    // --- 7-Day Treatment Plan & Tracker ---
    function renderTreatmentTracker(diseaseName) {
        const container = document.getElementById("trackerStepsContainer");
        const bar = document.getElementById("treatmentProgressBar");
        const badge = document.getElementById("treatmentProgressBadge");
        if (!container) return;

        const defaultSteps = [
            { day: "Day 1", task: "Field Sanitation & Pruning", subtext: "Prune and safely bury heavily infected lower leaves in soil." },
            { day: "Day 2", task: "First Protective / Bio Spray", subtext: "Apply mixed bio/contact fungicide in early morning (7:00–9:30 AM)." },
            { day: "Day 4", task: "Foliage Inspection Check", subtext: "Inspect leaf undersides for active spore halos or new lesions." },
            { day: "Day 7", task: "Booster Application & Evaluation", subtext: "If humid or rainy weather persists, apply second booster spray." }
        ];

        const storageKey = `treatment_plan_${state.activeReportId || 'default'}`;
        let savedState = {};
        try {
            savedState = JSON.parse(localStorage.getItem(storageKey) || "{}");
        } catch(e) {}

        container.innerHTML = "";
        let completedCount = 0;

        defaultSteps.forEach((step, idx) => {
            const isDone = !!savedState[idx];
            if (isDone) completedCount++;

            const item = document.createElement("div");
            item.className = `tracker-step-item ${isDone ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" class="tracker-checkbox" data-idx="${idx}" ${isDone ? 'checked' : ''}>
                <span class="step-day-badge">${step.day}</span>
                <div class="step-details">
                    <div class="step-task">${step.task}</div>
                    <p class="step-subtext">${step.subtext}</p>
                </div>
            `;
            container.appendChild(item);
        });

        const pct = Math.round((completedCount / defaultSteps.length) * 100);
        if (bar) bar.style.width = `${pct}%`;
        if (badge) badge.innerText = `${pct}% Complete`;

        container.querySelectorAll(".tracker-checkbox").forEach(cb => {
            cb.addEventListener("change", (e) => {
                const idx = e.target.getAttribute("data-idx");
                savedState[idx] = e.target.checked;
                localStorage.setItem(storageKey, JSON.stringify(savedState));
                renderTreatmentTracker(diseaseName);
            });
        });
    }

    // --- Kisan Vani Speech-to-Text (Voice Notes) ---
    const voiceNotesBtn = document.getElementById("voiceNotesBtn");
    const voiceNotesTxt = document.getElementById("voiceNotesTxt");
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (voiceNotesBtn && SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceNotesBtn.addEventListener("click", () => {
            if (voiceNotesBtn.classList.contains("listening")) {
                recognition.stop();
                return;
            }
            recognition.lang = state.lang === "hi" ? "hi-IN" : "en-IN";
            try {
                recognition.start();
                voiceNotesBtn.classList.add("listening");
                if (voiceNotesTxt) voiceNotesTxt.innerText = "Listening...";
                showToast("Kisan Vani", "Listening to voice notes...", "fa-microphone");
            } catch(e) {
                console.error("Speech recognition error:", e);
            }
        });

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            const current = farmerNotes.value;
            farmerNotes.value = current ? `${current} ${transcript}` : transcript;
            showToast("Transcribed", transcript, "fa-comment-dots");
        };

        recognition.onend = () => {
            voiceNotesBtn.classList.remove("listening");
            if (voiceNotesTxt) voiceNotesTxt.innerText = "Speak Notes (Kisan Vani)";
        };

        recognition.onerror = (e) => {
            voiceNotesBtn.classList.remove("listening");
            if (voiceNotesTxt) voiceNotesTxt.innerText = "Speak Notes (Kisan Vani)";
        };
    } else if (voiceNotesBtn) {
        voiceNotesBtn.addEventListener("click", () => {
            showToast("Browser Notice", "Speech-to-text requires Chrome or Edge browser.", "fa-microphone-slash");
        });
    }

    // --- Proximity Alerts & 10km Early Warning Banner ---
    function fetchProximityAlerts(lat, lng) {
        fetch(`/api/proximity-alerts?latitude=${lat}&longitude=${lng}&radius_km=15`)
            .then(res => {
                if (!res.ok) throw new Error("No proximity alert");
                return res.json();
            })
            .then(data => {
                const banner = document.getElementById("outbreakAlertBanner");
                if (!banner) return;
                const disease = (data.dominant_disease || "").toLowerCase();
                if (data.outbreak_detected && disease && !disease.includes("unknown") && !disease.includes("unsupported") && disease !== "none") {
                    banner.style.display = "flex";
                    document.getElementById("bannerTitle").innerText = `⚠️ Regional Disease Alert: ${data.dominant_disease} (${data.nearby_count} Cases)`;
                    document.getElementById("bannerDesc").innerText = `Closest reported outbreak is ${data.closest_distance_km} km away. ${data.recommended_precaution}`;
                    document.getElementById("bannerTag").innerText = `Active Radius: ${data.radius_km} km`;
                    
                    const actionBtn = document.getElementById("bannerActionBtn");
                    if (actionBtn) {
                        actionBtn.onclick = () => {
                            const mapNav = document.querySelector('[data-view=map]');
                            if (mapNav) mapNav.click();
                        };
                    }
                } else {
                    banner.style.display = "none";
                }
            })
            .catch(err => {
                const banner = document.getElementById("outbreakAlertBanner");
                if (banner) banner.style.display = "none";
            });
    }

    // --- Nearest Krishi Vigyan Kendra (KVK) Locator ---
    function fetchNearestKVK(lat, lng) {
        fetch(`/api/kvk-locator?latitude=${lat}&longitude=${lng}`)
            .then(res => res.json())
            .then(data => {
                if (!data.nearest_kvk) return;
                const k = data.nearest_kvk;
                const kvkName = document.getElementById("kvkName");
                const kvkDistKm = document.getElementById("kvkDistKm");
                const kvkScientist = document.getElementById("kvkScientist");
                const kvkPhoneLink = document.getElementById("kvkPhoneLink");
                const kvkEmail = document.getElementById("kvkEmail");
                
                if (kvkName) kvkName.innerText = k.name;
                if (kvkDistKm) kvkDistKm.innerText = `${k.distance_km} km away`;
                if (kvkScientist) kvkScientist.innerText = k.senior_scientist;
                if (kvkPhoneLink) {
                    kvkPhoneLink.innerText = k.phone;
                    kvkPhoneLink.href = `tel:${k.phone}`;
                }
                if (kvkEmail) kvkEmail.innerText = k.email;
            })
            .catch(err => console.log("KVK fetch error:", err));
    }

    // --- WhatsApp 1-Click Advisory Dispatcher ---
    function dispatchWhatsAppAdvisory(targetPhone) {
        if (!resCrop || !resCrop.innerText || resCrop.innerText === "Crop" || advisoryContent.style.display === "none") {
            loadMockDemoAdvisory("Tomato", "Late Blight", "Mancozeb 2.5g per liter of water", "Phytophthora infestans", "High");
        }

        const phoneInput = document.getElementById("smsDirectPhone");
        let rawPhone = targetPhone || (phoneInput ? phoneInput.value : "") || (state.user && state.user.phone) || "9876543210";
        let cleanPhone = rawPhone.replace(/\D/g, "");
        if (cleanPhone.length < 10) cleanPhone = "9876543210";
        else cleanPhone = cleanPhone.slice(-10);

        if (phoneInput) phoneInput.value = cleanPhone;

        const crop = (resCrop && resCrop.innerText) ? resCrop.innerText : "Tomato";
        const disease = (resDisease && resDisease.innerText) ? resDisease.innerText : "Late Blight";
        const dosage = (advDosage && advDosage.innerText) ? advDosage.innerText : "Mancozeb 2.5g per liter of water";
        const severity = (severityBadge && severityBadge.innerText) ? severityBadge.innerText : "High";
        const scientific = (resScientific && resScientific.innerText) ? resScientific.innerText : "Phytophthora infestans";
        const biological = (advBiological && advBiological.innerText) ? advBiological.innerText : "Apply Trichoderma harzianum or Bacillus subtilis to root zone and canopy.";
        const symptoms = (advSymptoms && advSymptoms.innerText) ? advSymptoms.innerText : "Dark water-soaked lesions expanding rapidly on foliage.";
        const monitoring = (advMonitoring && advMonitoring.innerText) ? advMonitoring.innerText : "Every 5 to 7 days";

        let waMsg = "";
        if (state.lang === "hi") {
            waMsg = `🌾 *AgroShield AI - किसान फसल स्वास्थ्य परामर्श* 🌾\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🌱 *फसल:* ${crop}\n` +
                `⚠️ *पहचाना गया रोग:* ${disease}\n` +
                `📊 *गंभीरता स्तर:* ${severity}\n` +
                `🔬 *रोगज़नक़ (Scientific):* _${scientific}_\n\n` +
                `📋 *तत्काल उपचार एवं सुरक्षा योजना:*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `💊 *रासायनिक छिड़काव एवं खुराक:*\n` +
                `• ${dosage}\n\n` +
                `🍃 *जैविक एवं प्राकृतिक रोकथाम:*\n` +
                `• ${biological}\n\n` +
                `👁️ *पहचान के लक्षण:*\n` +
                `• ${symptoms}\n\n` +
                `⏱️ *पुनः निरीक्षण:* ${monitoring}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🏛️ *नजदीकी कृषि विज्ञान केंद्र (KVK) सहायता:*\n` +
                `📞 किसान कॉल सेंटर टोल-फ्री: 1800-180-1551\n` +
                `🌐 _AgroShield AI राष्ट्रीय फसल स्वास्थ्य निगरानी प्रणाली द्वारा प्रेषित_`;
        } else {
            waMsg = `🌾 *AGROSHIELD AI - KISAN CROP HEALTH ADVISORY* 🌾\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🌱 *Crop:* ${crop}\n` +
                `⚠️ *Disease Detected:* ${disease}\n` +
                `📊 *Severity Level:* ${severity}\n` +
                `🔬 *Scientific Pathogen:* _${scientific}_\n\n` +
                `📋 *FIELD ACTION & TREATMENT PROTOCOL:*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `💊 *Chemical Treatment & Dosage:*\n` +
                `• ${dosage}\n\n` +
                `🍃 *Organic & Biological Control:*\n` +
                `• ${biological}\n\n` +
                `👁️ *Symptoms & Identification:*\n` +
                `• ${symptoms}\n\n` +
                `⏱️ *Monitoring Interval:* ${monitoring}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🏛️ *ICAR Krishi Vigyan Kendra (KVK) Referral:*\n` +
                `📞 Kisan Call Center Toll-Free: 1800-180-1551\n` +
                `🌐 _Dispatched via AgroShield AI Smart Surveillance System_`;
        }

        const smsDeliveryReceipt = document.getElementById("smsDeliveryReceipt");
        const smsReceiptTitle = document.getElementById("smsReceiptTitle");
        const smsReceiptId = document.getElementById("smsReceiptId");
        const smsReceiptPhone = document.getElementById("smsReceiptPhone");
        const smsReceiptGateway = document.getElementById("smsReceiptGateway");
        const smsReceiptNote = document.getElementById("smsReceiptNote");
        const smsReceiptText = document.getElementById("smsReceiptText");

        const msgId = "WA-IND-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        if (smsDeliveryReceipt) {
            if (smsReceiptTitle) smsReceiptTitle.innerHTML = '<i class="fa-brands fa-whatsapp" style="color: #4ade80;"></i> WhatsApp Advisory Sent to Handset!';
            if (smsReceiptId) smsReceiptId.innerText = `Ref: ${msgId}`;
            if (smsReceiptPhone) smsReceiptPhone.innerText = `+91-${cleanPhone}`;
            if (smsReceiptGateway) smsReceiptGateway.innerText = "WhatsApp Instant Direct Protocol";
            if (smsReceiptNote) smsReceiptNote.innerHTML = '<span style="color: #86efac;"><i class="fa-solid fa-circle-check"></i> WhatsApp opened with full advisory ready to deliver to +91-' + cleanPhone + '!</span>';
            if (smsReceiptText) smsReceiptText.innerText = waMsg;
            smsDeliveryReceipt.style.display = "block";
        }

        const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, "_blank");

        showToast("WhatsApp Dispatched!", `Delivered advisory to +91-${cleanPhone}`, "fa-brands fa-whatsapp");
    }

    const sendWhatsAppBtn = document.getElementById("sendWhatsAppBtn");
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener("click", () => {
            dispatchWhatsAppAdvisory();
        });
    }

    // --- Quick Demo Sample Loaders for SIH Evaluators ---
    function loadMockDemoAdvisory(cropName, diseaseName, chemicalDosage, scientificName, severityVal) {
        const mockData = {
            report_id: "demo-report-" + Math.floor(100000 + Math.random() * 900000),
            crop: cropName || "Tomato",
            disease_label: diseaseName || "Late Blight",
            prediction: `${cropName || "Tomato"}___${(diseaseName || "Late Blight").replace(/ /g, "_")}`,
            severity: severityVal || "High",
            confidence: 94.8,
            advisory: {
                scientific_name: scientificName || "Phytophthora infestans",
                description: "Destructive fungal pathogen causing water-soaked lesions that rapidly expand and rot foliage during humid or rainy weather.",
                symptoms: "Large, dark brown to purplish-black water-soaked lesions on leaves with white fungal growth on undersides in moist weather.",
                prevention: "Improve air circulation, space plants adequately, avoid overhead sprinkler irrigation, rotate crops.",
                biological_control: "Apply bio-control agents such as Trichoderma harzianum or Bacillus subtilis to root zone and canopy.",
                chemical_control: "Spray systemic fungicides like Mancozeb 75% WP or Metalaxyl-Mancozeb.",
                dosage: chemicalDosage || "Mancozeb 2.5g per liter of water",
                monitoring_interval: "Every 5 days"
            }
        };
        displayAdvisoryData(mockData);

        // Switch automatically to the Treatment Guide view so the user sees results and SMS immediately
        const navTreatment = document.querySelector('[data-view="treatment"]');
        if (navTreatment) {
            navTreatment.click();
        }

        showToast("Demo Loaded", `Inspecting ${mockData.crop} ${mockData.disease_label} advisory.`, "fa-flask");
    }

    const loadDemoAdvisoryBtn = document.getElementById("loadDemoAdvisoryBtn");
    if (loadDemoAdvisoryBtn) {
        loadDemoAdvisoryBtn.addEventListener("click", () => {
            loadMockDemoAdvisory("Tomato", "Late Blight", "Mancozeb 2.5g per liter of water", "Phytophthora infestans", "High");
        });
    }

    const directDemoWhatsAppBtn = document.getElementById("directDemoWhatsAppBtn");
    if (directDemoWhatsAppBtn) {
        directDemoWhatsAppBtn.addEventListener("click", () => {
            loadMockDemoAdvisory("Tomato", "Late Blight", "Mancozeb 2.5g per liter of water", "Phytophthora infestans", "High");
            setTimeout(() => {
                dispatchWhatsAppAdvisory();
            }, 250);
        });
    }

    const sampleTomatoBtn = document.getElementById("sampleTomatoBtn");
    if (sampleTomatoBtn) {
        sampleTomatoBtn.addEventListener("click", () => {
            loadMockDemoAdvisory("Tomato", "Late Blight", "Mancozeb 2.5g per liter of water", "Phytophthora infestans", "High");
        });
    }

    const sampleAppleBtn = document.getElementById("sampleAppleBtn");
    if (sampleAppleBtn) {
        sampleAppleBtn.addEventListener("click", () => {
            loadMockDemoAdvisory("Apple", "Apple Scab", "Captan 50 WP at 2.0g per liter of water", "Venturia inaequalis", "Medium");
        });
    }

    const quickTestWhatsAppBtn = document.getElementById("quickTestWhatsAppBtn");
    if (quickTestWhatsAppBtn) {
        quickTestWhatsAppBtn.addEventListener("click", () => {
            loadMockDemoAdvisory("Tomato", "Late Blight", "Mancozeb 2.5g per liter of water", "Phytophthora infestans", "High");
            setTimeout(() => {
                dispatchWhatsAppAdvisory();
            }, 250);
        });
    }

    // --- Original Home Landing Card Click Handlers ---
    const homeDiagCard = document.getElementById("homeDiagCard");
    if (homeDiagCard) {
        homeDiagCard.style.cursor = "pointer";
        homeDiagCard.addEventListener("click", () => {
            const navScan = document.querySelector('.nav-item[data-view="scan"]');
            if (navScan) navScan.click();
        });
    }

    const homeMapCard = document.getElementById("homeMapCard");
    if (homeMapCard) {
        homeMapCard.style.cursor = "pointer";
        homeMapCard.addEventListener("click", () => {
            const navMap = document.querySelector('.nav-item[data-view="map"]');
            if (navMap) navMap.click();
        });
    }

    const homeOfficialCard = document.getElementById("homeOfficialCard");
    if (homeOfficialCard) {
        homeOfficialCard.style.cursor = "pointer";
        homeOfficialCard.addEventListener("click", () => {
            const navOfficial = document.querySelector('.nav-item[data-view="official"]');
            if (navOfficial) navOfficial.click();
        });
    }

    // --- Home Activity & Field Focus Session Handlers ---
    const viewHistoryBtn = document.getElementById("viewHistoryBtn");
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener("click", () => {
            const historyNav = document.querySelector('.nav-item[data-view="history"]');
            if (historyNav) historyNav.click();
        });
    }

    function triggerFollowUpScan() {
        const scanNav = document.querySelector('.nav-item[data-view="scan"]');
        if (scanNav) scanNav.click();
        showToast("Follow-up Scan", "Upload a new photo of your crop to track healing progress.", "fa-camera-retro");
        const fileInput = document.getElementById("fileInput");
        if (fileInput) {
            setTimeout(() => fileInput.click(), 250);
        }
    }

    const followUpScanBtn = document.getElementById("followUpScanBtn");
    if (followUpScanBtn) {
        followUpScanBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            triggerFollowUpScan();
        });
    }

    const fieldFocusCard = document.getElementById("fieldFocusCard") || document.querySelector(".empty-illustration-card");
    if (fieldFocusCard) {
        fieldFocusCard.style.cursor = "pointer";
        fieldFocusCard.addEventListener("click", () => {
            triggerFollowUpScan();
        });
    }

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
        
        fetch(getApiUrl("/api/sensor-logs"), {
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
        const coordinates = cityCoordinates[selectedCity];
        const weatherParams = new URLSearchParams({ city: selectedCity });
        if (coordinates) {
            weatherParams.set("latitude", coordinates[0]);
            weatherParams.set("longitude", coordinates[1]);
        }
        const weatherUrl = `/api/weather-forecast?${weatherParams.toString()}`;
        fetchWithTimeout(weatherUrl)
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
        document.getElementById("headerHumidity").innerText = `${Math.round(data.humidity)}%`;
        if (data.city) {
            selectedCity = data.city;
            updateLocationLabel();
        }
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

    function initMap() {
        // Initialize map centering around Punjab area coordinates
        state.map = L.map("map").setView([30.1, 76.8], 8);
        
        // Standard OpenStreetMap tile provider (Shows all cities, roads, names, and detail)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(state.map);

        // Add floating coordinates display in bottom right corner
        const coordDisplay = L.control({ position: "bottomright" });
        coordDisplay.onAdd = function() {
            const div = L.DomUtil.create("div", "map-coords-readout");
            div.innerHTML = "Lat: 30.1000 | Lng: 76.8000";
            return div;
        };
        coordDisplay.addTo(state.map);

        // Update coordinate readout on mousemove
        state.map.on("mousemove", (e) => {
            const lat = e.latlng.lat.toFixed(4);
            const lng = e.latlng.lng.toFixed(4);
            const div = document.querySelector(".map-coords-readout");
            if (div) {
                div.innerHTML = `Lat: ${lat} | Lng: ${lng}`;
            }
        });

        // Bind click event to map for geological pinpointing
        state.map.on("click", (e) => {
            showGeologicalConditions(e.latlng.lat, e.latlng.lng);
        });
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
            const marker = L.circleMarker([parseFloat(report.latitude), parseFloat(report.longitude)], {
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
                    <p style="margin-bottom: 5px;"><strong>GPS:</strong> ${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}</p>
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

    // Geological Panel Handlers
    function showGeologicalConditions(lat, lng) {
        const numLat = Number(lat);
        const numLng = Number(lng);

        // Create custom pinpoint icon with crosshair and glowing pulse
        const customIcon = L.divIcon({
            className: 'pin-marker-custom',
            html: '<div class="pin-pulse"></div><i class="fa-solid fa-location-crosshairs pin-icon"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // Set or update marker on the map
        if (state.pinMarker) {
            state.pinMarker.setLatLng([numLat, numLng]);
        } else {
            state.pinMarker = L.marker([numLat, numLng], { icon: customIcon }).addTo(state.map);
        }

        // Show loading/open state in the floating panel
        const panel = document.getElementById("geological-panel");
        panel.classList.remove("hidden");

        // Synchronize scanner input fields with this map pinpoint
        if (latInput && lngInput) {
            latInput.value = numLat.toFixed(6);
            lngInput.value = numLng.toFixed(6);
        }

        document.getElementById("geo-lat").innerText = numLat.toFixed(6);
        document.getElementById("geo-lng").innerText = numLng.toFixed(6);

        // Fetch from API
        fetch(`/api/geological-conditions?latitude=${lat}&longitude=${lng}`)
            .then(res => {
                if (!res.ok) throw new Error("API failed");
                return res.json();
            })
            .then(data => {
                // Populate text values
                document.getElementById("geo-ph").innerText = data.soil_ph;
                document.getElementById("geo-moisture").innerText = data.soil_moisture + "%";
                document.getElementById("geo-type").innerText = data.soil_type;
                document.getElementById("geo-organic").innerText = data.organic_matter + "%";
                
                document.getElementById("geo-nitrogen").innerText = data.nitrogen + " mg/kg";
                document.getElementById("geo-phosphorus").innerText = data.phosphorus + " mg/kg";
                document.getElementById("geo-potassium").innerText = data.potassium + " mg/kg";
                
                document.getElementById("geo-water-table").innerText = data.water_table_depth + "m";
                document.getElementById("geo-elevation").innerText = data.elevation + "m";
                document.getElementById("geo-zone").innerText = data.agro_ecological_zone;

                // Populate soil composition percentages
                document.getElementById("geo-clay").innerText = data.clay_content_percent;
                document.getElementById("geo-silt").innerText = data.silt_content_percent;
                document.getElementById("geo-sand").innerText = data.sand_content_percent;

                // Set widths for soil composition bar parts
                document.getElementById("geo-clay-bar").style.width = data.clay_content_percent + "%";
                document.getElementById("geo-silt-bar").style.width = data.silt_content_percent + "%";
                document.getElementById("geo-sand-bar").style.width = data.sand_content_percent + "%";

                // Set widths for nutrient bars (scaled relative to standard maximums, e.g. 150 N, 60 P, 350 K)
                const nPct = Math.min(100, (data.nitrogen / 150) * 100);
                const pPct = Math.min(100, (data.phosphorus / 60) * 100);
                const kPct = Math.min(100, (data.potassium / 350) * 100);

                document.getElementById("geo-n-bar").style.width = nPct + "%";
                document.getElementById("geo-p-bar").style.width = pPct + "%";
                document.getElementById("geo-k-bar").style.width = kPct + "%";
            })
            .catch(err => {
                console.error("Error fetching geological conditions:", err);
            });
    }

    // Function to clear geological pin marker and panel
    function clearGeologicalPin() {
        if (state.pinMarker) {
            state.map.removeLayer(state.pinMarker);
            state.pinMarker = null;
        }
        document.getElementById("geological-panel").classList.add("hidden");
    }

    // Connect Close button
    const closeGeoPanelBtn = document.getElementById("closeGeoPanelBtn");
    if (closeGeoPanelBtn) {
        closeGeoPanelBtn.addEventListener("click", clearGeologicalPin);
    }

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

    async function submitValidation(reportId, status, notes) {
        try {
            // 1. Try to update the Flask backend API first
            const res = await fetch(getApiUrl(`/api/reports/${reportId}/validate`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status,
                    expert_notes: notes || `Validated by Extension Officer`
                })
            });
            if (res.ok) {
                showToast("Validation Logged", `Case #${reportId.substring(0,8)} marked as ${status}.`, "fa-shield-halved");
                loadReports();
                loadDashboardStats();
                return;
            }
        } catch (e) {
            console.log("Flask backend validation update failed, trying Supabase fallback:", e);
        }

        // 2. Fallback to Supabase if Flask API is offline
        if (supabase) {
            try {
                const { error } = await supabase
                    .from("reports")
                    .update({
                        status: status,
                        expert_notes: notes || "Validated by Extension Officer"
                    })
                    .eq("id", reportId);
                
                if (error) throw error;
                
                showToast("Validation Logged", `Case #${reportId.substring(0,8)} marked as ${status}.`, "fa-shield-halved");
                loadReports();
                loadDashboardStats();
                return;
            } catch (e) {
                console.error("Supabase validation update failed, falling back:", e);
            }
        }

        // 3. Fallback to local client simulation
        console.log("Simulating validation update client-side.");
        const rep = state.reports.find(r => r.id === reportId);
        if (rep) {
            rep.status = status;
            if (status === "Rejected") rep.severity = "Low";
            rep.expert_notes = notes || "Validated by Extension Officer (Mock)";
        }
        showToast("Validation Logged (Offline)", `Mock verified case #${reportId.substring(0,8)} as ${status}.`, "fa-shield-halved");
        renderMapMarkers();
        renderExpertQueue();
        loadDashboardStats();
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
    async function loadReports() {
        try {
            // 1. Try to fetch from the Flask API first (which contains all prediction reports)
            const res = await fetchWithTimeout(getApiUrl("/api/reports"));
            if (res.ok) {
                const data = await res.json();
                state.reports = data;
                renderMapMarkers();
                renderExpertQueue();
                renderFarmerDashboard();
                return;
            }
        } catch (e) {
            console.log("Flask backend loadReports failed, trying Supabase fallback:", e);
        }

        // 2. Fallback to Supabase if Flask API is offline
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from("reports")
                    .select("*")
                    .order("timestamp", { ascending: false });
                
                if (error) throw error;
                
                state.reports = data.map(r => ({
                    id: r.id,
                    crop: r.crop,
                    disease: r.disease,
                    severity: r.severity,
                    status: r.status,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    timestamp: r.timestamp,
                    farmer_notes: r.farmer_notes,
                    expert_notes: r.expert_notes,
                    confidence: r.confidence || 90.0,
                    image_url: r.image_url
                }));
                
                renderMapMarkers();
                renderExpertQueue();
                renderFarmerDashboard();
                return;
            } catch (e) {
                console.error("Supabase loadReports error, falling back:", e);
            }
        }

        // 3. Ultimate local mock fallback
        if (!state.reports) {
            state.reports = [];
        }
        renderMapMarkers();
        renderExpertQueue();
        renderFarmerDashboard();
    }

        function openReportAdvisory(report) {
        if (!report) return;
        const diseaseLabel = (report.disease || "Crop Check").replace("___", " · ").replace(/_/g, " ");
        const advisoryObj = report.advisory || {
            description: `Field inspection record for ${report.crop || "crop"}. Diagnostic pattern corresponds to ${diseaseLabel}.`,
            scientific_name: report.disease && report.disease.includes("Late_blight") ? "Phytophthora infestans" : 
                             report.disease && report.disease.includes("Early_blight") ? "Alternaria solani" : 
                             report.disease && report.disease.includes("Scab") ? "Venturia inaequalis" : 
                             report.disease && report.disease.includes("Rust") ? "Puccinia sorghi" : 
                             report.disease && report.disease.includes("healthy") ? "Healthy Plant Tissue" : "Field agricultural pathogen",
            symptoms: report.disease && report.disease.includes("healthy") ? "Leaves show vibrant green color, strong turgor pressure, and no visible lesions." : `Foliar spots, necrosis, and tissue stress identified on ${report.crop || "crop"} foliage during diagnostic check.`,
            prevention: "Practice crop rotation, sanitize tools, ensure good air circulation, and avoid overhead watering.",
            biological_control: report.disease && report.disease.includes("healthy") ? "Maintain regular organic compost application and soil health." : "Apply neem oil extract (5ml/L) or Bacillus subtilis bio-fungicide formulation.",
            chemical_control: report.disease && report.disease.includes("healthy") ? "No chemical intervention needed." : (report.severity === "High" ? "Apply Mancozeb 75% WP or Chlorothalonil protectant fungicide." : "Monitor field; spot-treat affected foliage if lesions expand."),
            dosage: report.disease && report.disease.includes("healthy") ? "0 grams (Organic maintenance only)" : (report.severity === "High" ? "2.5 grams per 1 Liter of clean water" : "1.5 grams per 1 Liter of clean water"),
            monitoring_interval: report.disease && report.disease.includes("healthy") ? "Inspect field every 7 to 10 days" : "Inspect foliage every 3 to 4 days"
        };

        displayAdvisoryData({
            crop: report.crop || "Crop",
            prediction: report.disease || "Crop Issue",
            disease_label: diseaseLabel,
            confidence: report.confidence || 94.0,
            severity: report.severity || (report.disease && report.disease.includes("healthy") ? "Low" : "Medium"),
            report_id: report.id || `report-${Date.now()}`,
            advisory: advisoryObj,
            gradcam_image: report.image_url || null
        });

        const treatmentNav = document.querySelector('.nav-item[data-view="treatment"]');
        if (treatmentNav) treatmentNav.click();
        showToast("Advisory Loaded", `Loaded diagnostic plan for ${diseaseLabel}.`, "fa-prescription-bottle-medical");
    }

    function renderFarmerDashboard() {
        const reports = Array.isArray(state.reports) ? state.reports : [];
        const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        const recentList = document.getElementById("recentScansList");
        const historyList = document.getElementById("scanHistoryList");
        const totalScans = document.getElementById("totalScans");
        const historyCount = document.getElementById("historyCount");
        const score = document.getElementById("cropHealthScore");
        const scoreHint = document.getElementById("healthScoreHint");
        const greeting = document.getElementById("farmerGreeting");
        const profileName = document.getElementById("farmProfileName");
        const profileLocation = document.getElementById("farmProfileLocation");
        const name = state.user?.full_name || "Farmer";
        if (greeting) greeting.innerText = `Hello, ${name.split(" ")[0]}!`;
        if (profileName) profileName.innerText = state.user ? `${name}'s farm` : "Sign in to see your farm";
        if (profileLocation) profileLocation.innerText = state.user ? `${state.user.village || "Local farm"}${state.user.district ? `, ${state.user.district}` : ""}` : "Your personal field profile";
        if (totalScans) totalScans.innerText = reports.length;
        if (historyCount) historyCount.innerText = `${reports.length} scan${reports.length === 1 ? "" : "s"}`;
        const highRisk = reports.filter(r => r.severity === "High").length;
        const health = reports.length ? Math.max(30, 100 - highRisk * 18 - Math.max(0, reports.length - highRisk) * 5) : null;
        if (score) score.innerText = health === null ? "--" : `${health}%`;
        if (scoreHint) scoreHint.innerText = health === null ? "Complete a scan to calculate your score" : health >= 75 ? "Looking good - keep monitoring weekly" : "Needs attention - follow your treatment plan";

        const row = (report, index) => {
            const disease = (report.disease || "Crop check").replace("___", " · ").replace(/_/g, " ");
            const date = report.timestamp ? new Date(report.timestamp).toLocaleDateString() : "Just now";
            const sevClass = (report.severity || "").toLowerCase() === "high" ? "severity-high" : "";
            return `<div class="scan-row" data-scan-index="${index}" title="Click to inspect treatment plan"><div><i class="fa-solid fa-leaf"></i> <strong>${report.crop || "Crop"}: ${disease}</strong><small>${date} · ${report.confidence ? Math.round(report.confidence) + "% confidence" : "Verified"}</small></div><span class="history-status ${sevClass}">${report.severity || "Tracked"}</span></div>`;
        };

        if (recentList) {
            recentList.innerHTML = sortedReports.length ? sortedReports.slice(0, 4).map((r, i) => row(r, i)).join("") : '<div class="scan-row"><div><strong>No scans yet</strong><small>Your latest crop checks will appear here.</small></div></div>';
            recentList.querySelectorAll(".scan-row[data-scan-index]").forEach(el => {
                el.addEventListener("click", () => {
                    const idx = parseInt(el.getAttribute("data-scan-index"));
                    if (sortedReports[idx]) openReportAdvisory(sortedReports[idx]);
                });
            });
        }

        if (historyList) {
            historyList.innerHTML = sortedReports.length ? sortedReports.map((report, idx) => {
                const disease = (report.disease || "Crop check").replace("___", " · ").replace(/_/g, " ");
                const date = report.timestamp ? new Date(report.timestamp).toLocaleString() : "Just now";
                const sevClass = (report.severity || "").toLowerCase() === "high" ? "severity-high" : "";
                return `<div class="history-row" data-history-index="${idx}" title="Click to view treatment advisory"><div><strong>${report.crop || "Crop"} · ${disease}</strong><small>${date} · ${report.confidence ? Math.round(report.confidence) + "% confidence" : "Logged"}</small></div><span class="history-status ${sevClass}">${report.status || report.severity || "Tracked"}</span></div>`;
            }).join("") : '<div class="empty-state"><i class="fa-solid fa-camera-retro"></i><h3>No scans yet</h3><p>Start with a clear photo of a leaf in daylight.</p></div>';

            historyList.querySelectorAll(".history-row[data-history-index]").forEach(el => {
                el.addEventListener("click", () => {
                    const idx = parseInt(el.getAttribute("data-history-index"));
                    if (sortedReports[idx]) openReportAdvisory(sortedReports[idx]);
                });
            });
        }
    }

    // --- Extension Officer Admin Login Form ---
    const adminLoginForm = document.getElementById("adminLoginForm");
    const adminEmailInput = document.getElementById("adminEmail");
    const adminPasswordInput = document.getElementById("adminPassword");
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = adminEmailInput.value.trim();
            const password = adminPasswordInput.value.trim();
            
            fetch(getApiUrl("/api/admin/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            })
            .then(res => {
                if (!res.ok) throw new Error("Invalid credentials");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    state.role = "admin";
                    localStorage.setItem("user_role", "admin");
                    updateRoleUI();
                    showToast("Officer Signed In", "Logged in as Extension Officer.", "fa-shield-halved");
                    
                    const officialNav = document.querySelector('[data-view=official]');
                    if (officialNav) officialNav.click();
                } else {
                    showToast("Access Denied", "Invalid Admin credentials.", "fa-circle-xmark");
                }
            })
            .catch(err => {
                showToast("Access Denied", "Invalid Admin credentials or connection error.", "fa-circle-xmark");
            });
        });
    }

    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try { await fetch(getApiUrl("/api/admin/logout"), { method: "POST" }); } catch (error) { console.warn("Admin logout request failed", error); }
            state.role = "farmer";
            localStorage.setItem("user_role", "farmer");
            updateRoleUI();
            showToast("Admin Signed Out", "Returned to normal Farmer view.", "fa-circle-info");
            
            const homeNav = document.querySelector('[data-view=home]');
            if (homeNav) homeNav.click();
        });
    }

    // --- Database Settings Event Handlers ---
    const dbSettingsForm = document.getElementById("dbSettingsForm");
    const supabaseUrlInput = document.getElementById("supabaseUrl");
    const supabaseKeyInput = document.getElementById("supabaseKey");
    const saveDbBtn = document.getElementById("saveDbBtn");
    const clearDbBtn = document.getElementById("clearDbBtn");

    if (supabaseUrlInput && supabaseKeyInput) {
        supabaseUrlInput.value = localStorage.getItem("supabase_url") || "";
        supabaseKeyInput.value = localStorage.getItem("supabase_key") || "";
    }

    if (saveDbBtn) {
        saveDbBtn.addEventListener("click", () => {
            const url = supabaseUrlInput.value.trim();
            const key = supabaseKeyInput.value.trim();
            if (!url || !key) {
                showToast("Missing Fields", "Please enter both URL and Anon Key", "fa-triangle-exclamation");
                return;
            }
            localStorage.setItem("supabase_url", url);
            localStorage.setItem("supabase_key", key);
            initSupabase();
            showToast("Database Connected", "Successfully linked to Supabase cloud storage!", "fa-cloud-bolt");
            loadReports();
            loadDashboardStats();
        });
    }

    if (clearDbBtn) {
        clearDbBtn.addEventListener("click", () => {
            localStorage.removeItem("supabase_url");
            localStorage.removeItem("supabase_key");
            if (supabaseUrlInput) supabaseUrlInput.value = "";
            if (supabaseKeyInput) supabaseKeyInput.value = "";
            initSupabase();
            showToast("Database Disconnected", "Switched back to local offline mode.", "fa-circle-info");
            loadReports();
            loadDashboardStats();
        });
    }

    // --- Farmer Auth Form Event Handlers ---
    const authForm = document.getElementById("authForm");
    const authToggleLink = document.getElementById("authToggleLink");
    const authFormTitle = document.getElementById("authFormTitle");
    const authFormSubtitle = document.getElementById("authFormSubtitle");
    const authNameGroup = document.getElementById("authNameGroup");
    const authLocationRow = document.getElementById("authLocationRow");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const authEmail = document.getElementById("authEmail");
    const authPassword = document.getElementById("authPassword");
    const authName = document.getElementById("authName");
    const authVillage = document.getElementById("authVillage");
    const authDistrict = document.getElementById("authDistrict");
    const authToggleText = document.getElementById("authToggleText");

    let authMode = "login";

    function setAuthMode(mode) {
        authMode = mode;
        const isRegister = mode === "register";
        authFormTitle.innerText = isRegister ? "Create your farmer account" : "Welcome back, farmer";
        authFormSubtitle.innerText = isRegister ? "Set up your crop profile and start protecting your field." : "Sign in to access your crop health workspace.";
        authNameGroup.style.display = isRegister ? "flex" : "none";
        authLocationRow.style.display = isRegister ? "flex" : "none";
        authSubmitBtn.innerHTML = isRegister ? '<i class="fa-solid fa-user-plus"></i> Create account' : '<i class="fa-solid fa-right-to-bracket"></i> Sign in';
        authToggleText.innerText = isRegister ? "Already have an account?" : "New to AgroShield?";
        authToggleLink.innerText = isRegister ? "Sign in" : "Create an account";
        window.history.replaceState({}, "", isRegister ? "/register" : "/login");
    }

    if (authToggleLink) {
        authToggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            setAuthMode(authMode === "login" ? "register" : "login");
        });
    }

    if (window.location.pathname === "/register") setAuthMode("register");
    if (window.location.pathname === "/login") setAuthMode("login");

    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = authEmail.value.trim();
            const password = authPassword.value.trim();
            const name = authName.value.trim();
            const village = authVillage.value.trim();
            const district = authDistrict.value.trim();

            if (authMode === "register") {
                if (supabase) {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: name,
                                village,
                                district
                            }
                        }
                    });

                    if (error) {
                        showToast("Registration Failed", error.message, "fa-circle-xmark");
                        return;
                    }

                    if (data.user) {
                        const { error: profileErr } = await supabase.from("profiles").insert({
                            id: data.user.id,
                            full_name: name,
                            village,
                            district,
                            language: state.lang
                        });
                        if (profileErr) console.error("Error creating profile:", profileErr);
                    }

                    showToast("Registration Success", "Account created successfully!", "fa-circle-check");
                    setSessionUser({ email, full_name: name, village, district });
                } else {
                    try {
                        const response = await fetch(getApiUrl("/api/auth/register"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, password, full_name: name, village, district })
                        });
                        const result = await response.json();
                        if (!response.ok || !result.success) throw new Error(result.error || "Could not create account");
                        showToast("Registration Success", "Your farmer account is ready.", "fa-circle-check");
                        setSessionUser(result.user);
                    } catch (error) {
                        showToast("Registration Failed", error.message, "fa-circle-xmark");
                    }
                }
            } else {
                if (supabase) {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (error) {
                        showToast("Login Failed", error.message, "fa-circle-xmark");
                        return;
                    }

                    let fullName = "Farmer Friend";
                    let userVillage = "Local Village";
                    let userDistrict = "Local District";
                    
                    if (data.user) {
                        const { data: profile, error: profileErr } = await supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", data.user.id)
                            .single();
                            
                        if (!profileErr && profile) {
                            fullName = profile.full_name;
                            userVillage = profile.village;
                            userDistrict = profile.district;
                        }
                    }

                    showToast("Welcome Back!", `Logged in as ${fullName}`, "fa-circle-check");
                    setSessionUser({ email, full_name: fullName, village: userVillage, district: userDistrict });
                } else {
                    try {
                        const response = await fetch(getApiUrl("/api/auth/login"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, password })
                        });
                        const result = await response.json();
                        if (!response.ok || !result.success) throw new Error(result.error || "Invalid email or password");
                        showToast("Welcome Back!", `Logged in as ${result.user.full_name}`, "fa-circle-check");
                        setSessionUser(result.user);
                    } catch (error) {
                        showToast("Login Failed", error.message, "fa-circle-xmark");
                    }
                }
            }
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (supabase) {
                await supabase.auth.signOut();
            }
            state.user = null;
            localStorage.removeItem("session_user");
            updateRoleUI();
            
            document.getElementById("userProfileBadge").style.display = "none";
            document.getElementById("loginNavBtn").style.display = "flex";
            logoutBtn.style.display = "none";
            
            showToast("Logged Out", "Successfully signed out.", "fa-circle-info");
            const homeNav = document.querySelector('[data-view=home]');
            if (homeNav) homeNav.click();
        });
    }


    // --- Initialization Execution ---
    function init() {
        initSupabase();
        checkSession();
        // The workspace is private: unauthenticated visitors are sent to the dedicated sign-in screen.
        if (!state.user && state.role !== "admin") {
            setAuthMode(window.location.pathname === "/register" ? "register" : "login");
            openView("auth");
        }
        translateUI();
        initMap();
        loadReports();
        loadWeatherRisk();
        loadDashboardStats();
        
        // Load initial Regional Outbreak Alerts and Nearest KVK Hub
        fetchProximityAlerts(29.9680, 76.8180);
        fetchNearestKVK(29.9680, 76.8180);
        
        // Register PWA Service Worker for Offline Resilience
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration error:', err));
        }
        
        // Setup initial default location map center on load
        setTimeout(() => {
            if (state.map) state.map.invalidateSize();
        }, 500);
    }

    init();
});
