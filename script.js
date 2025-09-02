document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    // تنظیم لینک GitHub
    document.getElementById('github-url').href = `https://github.com/${getRepoInfo()}`;
    
    // افزودن رویداد کلیک به دکمه ارسال
    sendBtn.addEventListener('click', sendMessage);
    
    // افزودن رویداد فشار دادن کلید Enter
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // افزودن رویداد به دکمه‌های سریع
    quickBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // تابع ارسال پیام
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (message) {
            // افزودن پیام کاربر به چت
            addMessage(message, 'user');
            userInput.value = '';
            
            // غیرفعال کردن ورودی تا دریافت پاسخ
            userInput.disabled = true;
            sendBtn.disabled = true;
            
            try {
                // پردازش پیام و تولید پاسخ
                const response = await processMessage(message);
                
                // افزودن پاسخ هوش مصنوعی به چت
                addMessage(response, 'ai');
                
            } catch (error) {
                console.error('Error:', error);
                addMessage('خطا در پردازش درخواست. لطفا دوباره تلاش کنید.', 'ai');
            } finally {
                // فعال کردن مجدد ورودی
                userInput.disabled = false;
                sendBtn.disabled = false;
                userInput.focus();
            }
        }
    }
    
    // تابع پردازش پیام و تولید پاسخ
    async function processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // تشخیص نوع درخواست کاربر
        if (containsMath(lowerMessage)) {
            return solveMathProblem(message);
        } else if (containsSearchQuery(lowerMessage)) {
            return await performWebSearch(message);
        } else {
            return generateChatResponse(message);
        }
    }
    
    // بررسی آیا پیام شامل مسئله ریاضی است
    function containsMath(message) {
        const mathKeywords = ['حساب', 'ریاضی', 'جمع', 'تفریق', 'ضرب', 'تقسیم', 'محاسبه', 'مسئله', 'معادله'];
        return mathKeywords.some(keyword => message.includes(keyword)) || 
               /[\d\+\-\*\/\(\)]/.test(message);
    }
    
    // بررسی آیا پیام شامل درخواست جستجو است
    function containsSearchQuery(message) {
        const searchKeywords = ['جستجو', 'پیدا کن', 'اخبار', 'جدید', 'به روز', 'سرچ', 'information', 'info'];
        return searchKeywords.some(keyword => message.includes(keyword));
    }
    
    // حل مسئله ریاضی
    function solveMathProblem(problem) {
        try {
            // حذف کاراکترهای غیر ضروری از عبارت ریاضی
            const mathExpression = problem.replace(/[^\d\+\-\*\/\(\)\.]/g, '');
            
            if (!mathExpression) {
                return "عبارت ریاضی معتبری پیدا نکردم. لطفاً یک عبارت ریاضی وارد کنید.";
            }
            
            // استفاده از کتابخانه math.js برای محاسبه
            const result = math.evaluate(mathExpression);
            return `نتیجه محاسبه ${mathExpression} = ${result}`;
        } catch (error) {
            return "نتوانستم مسئله ریاضی را حل کنم. لطفاً یک عبارت معتبر وارد کنید.";
        }
    }
    
    // انجام جستجوی وب
    async function performWebSearch(query) {
        try {
            // حذف کلمات کلیدی جستجو از query
            const searchQuery = query.replace(/جستجو|پیدا کن|سرح|اخبار|جدید|به روز/gi, '').trim();
            
            if (!searchQuery) {
                return "لطفاً موضوعی برای جستجو مشخص کنید.";
            }
            
            // استفاده از API رایگان DuckDuckGo برای جستجو
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`);
            const data = await response.json();
            
            if (data.AbstractText) {
                return `نتایج جستجو برای "${searchQuery}":\n${data.AbstractText}`;
            } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                return `نتایج جستجو برای "${searchQuery}":\n${data.RelatedTopics[0].Text}`;
            } else {
                return `هیچ نتیجه‌ای برای "${searchQuery}" پیدا نکردم.`;
            }
        } catch (error) {
            console.error('Search error:', error);
            return "خطا در انجام جستجو. لطفاً دوباره تلاش کنید.";
        }
    }
    
    // تولید پاسخ برای گفتگوی معمولی
    function generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // پاسخ‌های از پیش تعریف شده برای برخی سوالات متداول
        const responses = {
            'سلام': 'سلام! چطور می‌توانم کمک کنم؟',
            'خداحافظ': 'خداحافظ! خوشحال می‌شوم اگر باز هم کمک لازم داشتید.',
            'تشکر': 'خواهش می‌کنم! خوشحالم که توانستم کمک کنم.',
            'اسم تو چیست': 'من یک هوش مصنوعی چت هستم که برای کمک به شما طراحی شده‌ام.',
            'چه کاری می توانی انجام دهی': 'من می‌توانم در موضوعات مختلف گفتگو کنم، مسائل ریاضی را حل کنم و اطلاعاتی را جستجو کنم.'
        };
        
        // بررسی آیا پاسخ از پیش تعریف شده وجود دارد
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return value;
            }
        }
        
        // اگر پاسخ خاصی پیدا نشد، از پاسخ‌های عمومی استفاده کنید
        const generalResponses = [
            "جالب است! در این مورد بیشتر بگویید.",
            "منظورتان را متوجه نشدم. می‌توانید clearer توضیح دهید؟",
            "در این مورد اطلاعاتی دارم، اما شاید بتوانم با جستجو اطلاعات بیشتری پیدا کنم.",
            "متأسفم، هنوز در حال یادگیری هستم و ممکن است نتوانم به همه سوالات پاسخ دهم."
        ];
        
        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }
    
    // مدیریت اقدامات سریع
    function handleQuickAction(action) {
        switch(action) {
            case 'ریاضی':
                userInput.value = "لطفاً یک مسئله ریاضی وارد کنید (مثلاً 2+2)";
                userInput.focus();
                break;
            case 'جستجو':
                userInput.value = "لطفاً موضوعی برای جستجو وارد کنید";
                userInput.focus();
                break;
            case 'پاک کردن':
                if (confirm('آیا از پاک کردن تاریخچه چت مطمئن هستید؟')) {
                    chatBox.innerHTML = '';
                    addMessage('همه مکالمات پاک شدند. چگونه می‌توانم کمک کنم؟', 'ai');
                }
                break;
        }
    }
    
    // تابع افزودن پیام به چت
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        const avatarIcon = document.createElement('i');
        avatarIcon.classList.add('mdi', sender === 'user' ? 'mdi-account' : 'mdi-robot');
        avatar.appendChild(avatarIcon);
        
        const content = document.createElement('div');
        content.classList.add('content');
        
        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.textContent = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('time');
        timeDiv.textContent = getCurrentTime();
        
        content.appendChild(textDiv);
        content.appendChild(timeDiv);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatBox.appendChild(messageDiv);
        
        // اسکرول به پایین
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // تابع دریافت زمان فعلی
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // تابع دریافت اطلاعات ریپازیتوری GitHub
    function getRepoInfo() {
        // این تابع می‌تواند اطلاعات ریپازیتوری را از URL دریافت کند
        // در این نمونه، یک مقدار پیش‌فرض برگردانده می‌شود
        return "username/repository-name";
    }
    
    // فوکوس روی فیلد ورودی هنگام بارگذاری صفحه
    userInput.focus();
});
