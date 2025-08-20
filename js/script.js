// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // --- STATE (hoisted) ---
    let currentIndex = 1;
    let chapter2CurrentIndex = 1;
    let chapter3CurrentIndex = 1;
    let chapter4CurrentIndex = 1;

    let isThrottled = false;          // 统一节流开关
    let lastScrollTop = 0;            // 用于方向判断
    const typingState = { token: 0 }; // 打字机取消令牌

    // 统一缓存 DOM（避免重复查询）
    const el = {
        startBtn: document.getElementById('startBtn'),
        hero: document.getElementById('hero'),
        newPage1: document.getElementById('newPage1'),
        newPage2: document.getElementById('newPage2'),
        newPage3: document.getElementById('newPage3'),
        newPage4: document.getElementById('newPage4'),
        subtitleSection: document.getElementById('subtitleSection'),
        chapter1Section: document.getElementById('chapter1Section'),
        chapter2Section: document.getElementById('chapter2Section'),
        chapter2PhotosSection: document.getElementById('chapter2PhotosSection'),
        chapter3Section: document.getElementById('chapter3Section'),
        chapter3PhotosSection: document.getElementById('chapter3PhotosSection'),
        chapter4Section: document.getElementById('chapter4Section'),
        chapter4PhotosSection: document.getElementById('chapter4PhotosSection'),
        analysisSection: document.querySelector('.analysis-section'),
        transitionSection: document.getElementById('transitionSection'),
        chapter2TransitionSection: document.getElementById('chapter2TransitionSection'),
        customBackgroundSection: document.getElementById('customBackgroundSection'),
        navLinks: document.querySelectorAll('.quick-nav a'),
        // 画廊
        verticalSlides: Array.from(document.querySelectorAll('#verticalGallery .vertical-slide')) || Array.from(document.querySelectorAll('.vertical-slide')),
        chapter2Slides: Array.from(document.querySelectorAll('#chapter2VerticalGallery .vertical-slide')),
        chapter3Slides: Array.from(document.querySelectorAll('#chapter3VerticalGallery .vertical-slide')),
        chapter4Slides: Array.from(document.querySelectorAll('#chapter4VerticalGallery .vertical-slide')),
        // 指示器/字幕
        chapter1Indicators: document.querySelectorAll('#chapter1Indicators .indicator'),
        chapter2Indicators: document.querySelectorAll('#chapter2Indicators .indicator'),
        chapter3Indicators: document.querySelectorAll('#chapter3Indicators .indicator'),
        chapter4Indicators: document.querySelectorAll('#chapter4Indicators .indicator'),
        dynamicSubtitle: document.getElementById('dynamicSubtitle'),
        subtitleText: document.querySelector('#dynamicSubtitle .subtitle-text'),
        chapter4DynamicSubtitle: document.getElementById('chapter4DynamicSubtitle'),
        chapter4SubtitleText: document.querySelector('#chapter4DynamicSubtitle .subtitle-text'),
        // 第二章字幕
        chapter2DynamicSubtitle: document.getElementById('chapter2DynamicSubtitle'),
        chapter2SubtitleText: document.querySelector('#chapter2DynamicSubtitle .subtitle-text'),
        // 第三章字幕
        chapter3DynamicSubtitle: document.getElementById('chapter3DynamicSubtitle'),
        chapter3SubtitleText: document.querySelector('#chapter3DynamicSubtitle .subtitle-text'),
        // 模态框
        techDetailModal: document.getElementById('techDetailModal'),
    };

                  // 明确顺序列表（按期望顺序排列）
     const SECTIONS = [
         '#newPage1',
         '#newPage2', 
         '#newPage3',
         '#newPage4',
         '#subtitleSection',
         '#chapter1Section', 
         '#transitionSection', // 过渡部分现在位于四张照片模块之后
         '#newsLiuDehuaSection', // 刘德华新闻页面
         '#newsBaoSection', // 包新闻页面
         '#blackBackgroundSection', // 第一个黑色背景页面
         '#blackBackgroundSection2', // 第二个黑色背景页面（bubble-chart）
         '#blackBackgroundSection3', // 第三个黑色背景页面（自定义背景）
         '.analysis-section',
         '#chapter2Section',
         '#chapter2PhotosSection',
 // 添加新的第二章节过渡页面
           '#customBackgroundSectionNews', // 添加新闻meeting you and 张背景页面
         '#customCoverSection1', // 添加自定义封面页面1

           '#customBackgroundSection', // 添加新的自定义背景页面
           '#customCoverSection2', // 添加自定义封面页面2
           '#priceBackgroundSection', // 添加价格背景页面

           '#emotionTendencySection', // 添加情感倾向背景页面
           '#customCoverSection3', // 添加自定义封面页面3
           '#chapter2TransitionSection',
           '#sheIsNotSheSection', // 添加她不是她页面
           '#chapter3Section',
           '#chapter3PhotosSection', // 添加第三幕照片展示区
           '#chapter3CustomBackgroundSection', // 添加第三幕自定义背景页面
           '#chapter3CustomCoverSection3', // 添加第三幕自定义封面页面3
           '#chapter3CustomCoverSection1', // 添加第三幕自定义封面页面1
           '#chapter3CustomCoverSection2', // 添加第三幕自定义封面页面2
           '#chapter4Section',
           '#chapter4PhotosSection',
           '#ending',
           '#endingCustomCoverSection' // 添加结束前自定义背景页面
      ].filter(Boolean);

    // --- UTIL ---
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function inViewport(dom, topRatio = 0.8, bottomRatio = 0.2) {
        if (!dom) return false;
        const vh = window.innerHeight;
        const r = dom.getBoundingClientRect();
        return r.top < vh * topRatio && r.bottom > vh * bottomRatio;
    }

    // 检测分析部分是否在视口中，控制右下角图片显示
    function checkAnalysisSectionVisibility() {
        const analysisSection = document.querySelector('.analysis-section');
        const bottomRightImage = document.querySelector('.bottom-right-image');
        const topLeftImage = document.querySelector('.top-left-image'); // 添加左上角图片引用
        
        if (analysisSection) {
            const isVisible = inViewport(analysisSection, 0.6, 0.4); // 调整阈值，让显示/隐藏更加精确
            
            if (bottomRightImage) {
                if (isVisible) {
                    bottomRightImage.classList.add('show');
                } else {
                    bottomRightImage.classList.remove('show');
                }
            }
            
            if (topLeftImage) { // 控制左上角图片的显示/隐藏
                if (isVisible) {
                    topLeftImage.classList.add('show');
                } else {
                    topLeftImage.classList.remove('show');
                }
            }
        }
    }

    function throttleOnce(ms = 700) {
        if (isThrottled) return true;
        isThrottled = true;
        setTimeout(()=>{ isThrottled = false; }, ms);
        return false;
    }

    function scrollToSection(index) {
        if (index < 0 || index >= SECTIONS.length) return false;
        const elTarget = document.querySelector(SECTIONS[index]);
        if (!elTarget) return false;
        
        // 使用更平滑的滚动
        elTarget.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        return true;
    }

    function getCurrentSectionIndex() {
        const vh = window.innerHeight;
        for (let i = 0; i < SECTIONS.length; i++) {
            const elTarget = document.querySelector(SECTIONS[i]);
            if (!elTarget) continue;
            const rect = elTarget.getBoundingClientRect();
            // 调整检测阈值，让页面切换更准确，特别是对于新添加的页面
            // 使用更宽松的阈值，确保新页面不会被跳过
            if (rect.top < vh * 0.7 && rect.bottom > vh * 0.1) {
                // 添加调试信息，帮助确认页面检测
                if (SECTIONS[i] === '#endingCustomCoverSection') {
                    console.log('检测到endingCustomCoverSection页面，索引:', i);
                }
                return i;
            }
        }
        return -1;
    }

    function scrollToNextSection() {
        const idx = getCurrentSectionIndex();
        if (idx >= 0 && idx < SECTIONS.length - 1) return scrollToSection(idx + 1);
        return false;
    }
    function scrollToPreviousSection() {
        const idx = getCurrentSectionIndex();
        if (idx > 0) return scrollToSection(idx - 1);
        return false;
    }

    // 统一的"画廊滚动处理器"
    function handleGalleryScroll(delta, { slides, getIndex, setIndex, sectionEl }) {
        if (!slides?.length || !sectionEl) return false;
        if (!inViewport(sectionEl)) return false;

        const atFirst = getIndex() === 1 && delta < 0;
        const atLast  = getIndex() === slides.length && delta > 0;

        if (atLast && delta > 0) {
            if (throttleOnce(900)) return true;
            scrollToNextSection();
            return true;
        }
        if (atFirst || atLast) return false; // 交给自然滚动/其他处理

        // 真正切图
        if (throttleOnce(700)) return true;
        if (delta > 0 && getIndex() < slides.length) setIndex(getIndex() + 1);
        else if (delta < 0 && getIndex() > 1) setIndex(getIndex() - 1);
        return true;
    }

    // 导航辅助函数

    // 平滑滚动
    // 导航栏平滑滚动功能
    el.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });



    // 预加载图片
    el.verticalSlides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img && img.dataset && !img.complete) {
            const pre = new Image();
            pre.src = img.src;
        }
    });

    // 开始按钮：保留原有Hero，滚动进入章节
    if (el.startBtn) {
        el.startBtn.addEventListener('click', function () {
            el.hero.classList.add('changed');
            // 修复：使用CSS类来控制背景图片切换，而不是直接设置style
            // 移除直接设置backgroundImage的代码，让CSS类来处理
            
            // 照片切换后多停留两秒（总共2.3秒）再去下一个界面
            setTimeout(() => {
                // 先滚动到字幕封面区域，停留一段时间后再进入图片章节（由用户滚动触发）
                if (el.subtitleSection) {
                    el.subtitleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1300); // 从300毫秒改为2300毫秒（2.3秒）
        });
    }

    // 保留一个用于"进入视口加 .in-view"的 Observer，并删除与滚动方向相关的判断
    const fadeObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                console.log('页面进入视口，添加in-view类:', entry.target.id);
            } else {
                entry.target.classList.remove('in-view');
                console.log('页面离开视口，移除in-view类:', entry.target.id);
            }
        });
    }, { threshold: 0.1 });

         // 观察主要模块，注意空值判断
     [
         el.hero, el.newPage1, el.newPage2, el.newPage3, el.newPage4, el.subtitleSection, el.chapter1Section, el.chapter2Section,
         el.chapter2PhotosSection, el.chapter3Section, el.chapter3PhotosSection, el.chapter4Section,
                  el.chapter4PhotosSection, el.analysisSection, el.transitionSection, el.chapter2TransitionSection, el.customBackgroundSection,
          document.getElementById('priceBackgroundSection'), // 添加价格背景页面
          document.getElementById('chapter3CustomBackgroundSection'), // 添加第三幕自定义背景页面
          document.getElementById('customCoverSection1'), // 添加自定义封面页面1
          document.getElementById('customCoverSection2'), // 添加自定义封面页面2
          document.getElementById('emotionTendencySection'), // 添加情感倾向背景页面
          document.getElementById('customCoverSection3'), // 添加自定义封面页面3
          document.getElementById('chapter3CustomCoverSection1'), // 添加第三幕自定义封面页面1
          document.getElementById('chapter3CustomCoverSection2'), // 添加第三幕自定义封面页面2
          document.getElementById('chapter3CustomCoverSection3'), // 添加第三幕自定义封面页面3
          document.getElementById('endingCustomCoverSection'), // 添加结束前自定义背景页面
          document.getElementById('ending'), // 添加ending页面
         el.newsLiuDehuaSection, // 添加刘德华新闻页面
         el.newsBaoSection // 添加包新闻页面
     ].forEach(n => { 
         if (n) {
             fadeObserver.observe(n);
             console.log('观察器已添加页面:', n.id);
         } else {
             console.log('页面元素未找到');
         }
     });

    // 单独的字幕浮现（如需）
    const subtitleObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
    }, { threshold: 0.4 });
    if (el.subtitleSection) subtitleObserver.observe(el.subtitleSection);
    if (el.chapter2Section) subtitleObserver.observe(el.chapter2Section);
    if (el.chapter3Section) subtitleObserver.observe(el.chapter3Section);
    if (el.chapter3PhotosSection) subtitleObserver.observe(el.chapter3PhotosSection);
    if (el.chapter4Section) subtitleObserver.observe(el.chapter4Section);

    function setActive(index) {
        if (!el.verticalSlides?.length) return;
        currentIndex = clamp(index, 1, el.verticalSlides.length);
        el.verticalSlides.forEach((s, i) => s.classList.toggle('active', i === currentIndex - 1));

        // 第一章指示器
        if (el.chapter1Indicators?.length) {
            el.chapter1Indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex - 1));
        }

        // 第一章字幕（可选存在时）
        if (el.dynamicSubtitle && el.subtitleText) {
            const T = [
                '', // 第1张图片（新添加的）不显示字幕
                '她的身影在电脑上慢慢浮现，我好像...做到了...',
                '她不能拥抱我了',
                '但"她"有了她的外貌、她的习惯，她说"早点睡"的语气',
                '我仿佛找回了那个"她"'
            ];
            if (currentIndex >= 1 && currentIndex <= T.length) {
                el.dynamicSubtitle.classList.remove('fade-out');
                el.dynamicSubtitle.classList.add('show');
                typeSubtitle(T[currentIndex - 1], el.subtitleText);
            } else {
                el.dynamicSubtitle.classList.remove('show', 'fade-out');
            }
        }
    }

    // 打字机效果函数
    function typeSubtitle(text, element) {
        if (!element) return;
        // 取消上一次
        const myToken = ++typingState.token;

        element.textContent = '';
        let i = 0;

        function tick() {
            // 若已有新的打字任务启动，则终止本次
            if (myToken !== typingState.token) return;
            if (i < text.length) {
                element.textContent += text.charAt(i++);
                setTimeout(tick, 100);
            }
        }
        tick();
    }

    // 移除 updateCaption

    // 打字机效果
    // 移除 typeCaption 与相关状态



    // 仅在需要 preventDefault 的情况下使用非被动监听
    window.addEventListener('wheel', (e) => {
        // 打开技术详情时不干预
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;

        const vh = window.innerHeight;
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 检测分析部分可见性，控制右下角图片显示
        checkAnalysisSectionVisibility();

        // 先处理画廊
        const handled =
            handleGalleryScroll(e.deltaY, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(e.deltaY, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(e.deltaY, {
                slides: el.chapter3Slides,
                getIndex: ()=> chapter3CurrentIndex,
                setIndex: setChapter3Active,
                sectionEl: el.chapter3PhotosSection
            }) ||
            handleGalleryScroll(e.deltaY, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) { e.preventDefault(); return; }

        // 其他区：基于 SECTIONS 的显式导航
        if (throttleOnce(500)) return; // 进一步减少节流时间，让滚动更流畅
        if (e.deltaY > 0) scrollToNextSection(); else scrollToPreviousSection();
    }, { passive: false });

    let touchStartY = 0;
    window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
        // 打开技术详情时不干预
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;
        if (inViewport(el.analysisSection)) return;

        const dy = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(dy) < 40) return;

        const delta = dy > 0 ? 1 : -1;

        // 检测分析部分可见性，控制右下角图片显示
        checkAnalysisSectionVisibility();

        const handled =
            handleGalleryScroll(delta, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter3Slides,
                getIndex: ()=> chapter3CurrentIndex,
                setIndex: setChapter3Active,
                sectionEl: el.chapter3PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) return;

        if (throttleOnce(500)) return; // 进一步减少节流时间
        if (delta > 0) scrollToNextSection(); else scrollToPreviousSection();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        // 检查是否在技术详情模态框中
        if (el.techDetailModal && el.techDetailModal.style.display === 'block') return;

        // 添加Start键（S键）快捷键支持
        if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (el.hero) {
                el.hero.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                return;
            }
        }

        // 原有的方向键和翻页键支持
        if (!['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)) return;

        const delta = (e.key === 'ArrowDown' || e.key === 'PageDown') ? 1 : -1;

        // 检测分析部分可见性，控制右下角图片显示
        checkAnalysisSectionVisibility();

        const handled =
            handleGalleryScroll(delta, {
                slides: el.verticalSlides,
                getIndex: ()=> currentIndex,
                setIndex: setActive,
                sectionEl: el.chapter1Section
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter2Slides,
                getIndex: ()=> chapter2CurrentIndex,
                setIndex: setChapter2Active,
                sectionEl: el.chapter2PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter3Slides,
                getIndex: ()=> chapter3CurrentIndex,
                setIndex: setChapter3Active,
                sectionEl: el.chapter3PhotosSection
            }) ||
            handleGalleryScroll(delta, {
                slides: el.chapter4Slides,
                getIndex: ()=> chapter4CurrentIndex,
                setIndex: setChapter4Active,
                sectionEl: el.chapter4PhotosSection
            });

        if (handled) { e.preventDefault(); return; }

        if (throttleOnce(500)) return; // 进一步减少节流时间
        if (delta > 0) scrollToNextSection(); else scrollToPreviousSection();
    });



    function setChapter2Active(index) {
        if (!el.chapter2Slides?.length) return;
        chapter2CurrentIndex = clamp(index, 1, el.chapter2Slides.length);
        el.chapter2Slides.forEach((s, i) => s.classList.toggle('active', i === chapter2CurrentIndex - 1));
        // 指示器
        if (el.chapter2Indicators?.length) {
            el.chapter2Indicators.forEach((ind, i) => ind.classList.toggle('active', i === chapter2CurrentIndex - 1));
        }

        // 第二章字幕
        if (el.chapter2DynamicSubtitle && el.chapter2SubtitleText) {
            const T2 = [

            ];
            if (chapter2CurrentIndex >= 1 && chapter2CurrentIndex <= T2.length) {
                el.chapter2DynamicSubtitle.classList.remove('fade-out');
                el.chapter2DynamicSubtitle.classList.add('show');
                typeSubtitle(T2[chapter2CurrentIndex - 1], el.chapter2SubtitleText);
            } else {
                el.chapter2DynamicSubtitle.classList.remove('show', 'fade-out');
            }
        }
    }

    function setChapter3Active(index) {
        if (!el.chapter3Slides?.length) return;
        chapter3CurrentIndex = clamp(index, 1, el.chapter3Slides.length);
        el.chapter3Slides.forEach((s, i) => s.classList.toggle('active', i === chapter3CurrentIndex - 1));
        // 指示器
        if (el.chapter3Indicators?.length) {
            el.chapter3Indicators.forEach((ind, i) => ind.classList.toggle('active', i === chapter3CurrentIndex - 1));
        }

        // 第三章字幕
        if (el.chapter3DynamicSubtitle && el.chapter3SubtitleText) {
            const T3 = [
                '当技术触及灵魂的边界',
                '我们是否还能保持理性？'
            ];
            if (chapter3CurrentIndex >= 1 && chapter3CurrentIndex <= T3.length) {
                el.chapter3DynamicSubtitle.classList.remove('fade-out');
                el.chapter3DynamicSubtitle.classList.add('show');
                typeSubtitle(T3[chapter3CurrentIndex - 1], el.chapter3SubtitleText);
            } else {
                el.chapter3DynamicSubtitle.classList.remove('show', 'fade-out');
            }
        }
    }

    function setChapter4Active(index) {
        if (!el.chapter4Slides?.length) return;
        chapter4CurrentIndex = clamp(index, 1, el.chapter4Slides.length);
        el.chapter4Slides.forEach((s, i) => s.classList.toggle('active', i === chapter4CurrentIndex - 1));

        // 第四章指示器
        if (el.chapter4Indicators?.length) {
            el.chapter4Indicators.forEach((ind, i) => ind.classList.toggle('active', i === chapter4CurrentIndex - 1));
        }

        // 第四章字幕（使用更具体的选择器）
        if (el.chapter4DynamicSubtitle && el.chapter4SubtitleText) {
            const T4 = [
                '屏幕熄灭，光点消散。',
                '逝者未归，记忆犹在。',
                'AI能模拟声音，却无法复制灵魂。',
                '它带来慰藉，也带来疑问。',
                '技术是一盏灯，但不该越过生命的边界。',
                '我们需要守护记忆，而不是依赖幻象。',
                '告别，或许才是最深的怀念。'
            ];
            const txt = T4[clamp(chapter4CurrentIndex - 1, 0, T4.length - 1)];
            el.chapter4DynamicSubtitle.classList.remove('fade-out');
            el.chapter4DynamicSubtitle.classList.add('show');
            typeSubtitle(txt, el.chapter4SubtitleText);
        }
    }


    // 技术详情模态框函数
    function showTechDetail(techType) {
        const modal = el.techDetailModal;
        if (!modal) return;
        
        const pages = document.querySelectorAll('.tech-detail-page');

        pages.forEach(page => page.classList.remove('active'));

        const targetPage = document.getElementById(techType + '-detail');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        modal.style.display = 'block';
        // 使用Slide-in效果
        modal.classList.remove('hide');
        modal.classList.add('show');
    }

    function closeTechDetail() {
        const modal = el.techDetailModal;
        if (!modal) return;
        
        // 使用Slide-in效果
        modal.classList.remove('show');
        modal.classList.add('hide');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hide');
        }, 600); // 等待动画完成
    }

    // 将函数绑定到全局作用域，以便HTML中的onclick能调用
    window.showTechDetail = showTechDetail;
    window.closeTechDetail = closeTechDetail;
    
    // 技术预览界面函数
    function showPreview(techType) {
        const previewContainer = document.getElementById('techDetailPreview');
        if (!previewContainer) return;
        
        // 隐藏所有预览内容
        const allPreviews = previewContainer.querySelectorAll('.preview-content');
        allPreviews.forEach(preview => preview.classList.remove('active'));
        
        // 显示对应的预览内容
        const targetPreview = document.getElementById(techType + 'Preview');
        if (targetPreview) {
            targetPreview.classList.add('active');
        }
        
        // 添加显示动画
        previewContainer.style.opacity = '0';
        previewContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            previewContainer.style.opacity = '1';
            previewContainer.style.transform = 'translateY(0)';
        }, 50);
    }
    
    function closePreview() {
        const previewContainer = document.getElementById('techDetailPreview');
        if (!previewContainer) return;
        
        // 隐藏所有预览内容
        const allPreviews = previewContainer.querySelectorAll('.preview-content');
        allPreviews.forEach(preview => preview.classList.remove('active'));
        
        // 显示默认概览内容
        const overviewPreview = document.getElementById('overviewPreview');
        if (overviewPreview) {
            overviewPreview.classList.add('active');
        }
        
        // 添加隐藏动画
        previewContainer.style.opacity = '0';
        previewContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            previewContainer.style.opacity = '1';
            previewContainer.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // 将预览函数绑定到全局作用域
    window.showPreview = showPreview;
    window.closePreview = closePreview;

    // 绑定模态框点击事件
    if (el.techDetailModal) {
        el.techDetailModal.addEventListener('click', function (e) {
            if (e.target === el.techDetailModal) {
                closeTechDetail();
            }
        });
    }

         // 热度按钮功能 - 切换不同的Flourish iframe
initHeatCharts(); // 启用热度按钮iframe切换功能

// 热度按钮功能 - 切换不同的Flourish iframe
function initHeatCharts() {
    const container = document.getElementById('chartContainer');
    const buttons = document.querySelectorAll('.heat-item');
    if (!container || buttons.length === 0) return;

    // 定义不同的Flourish iframe
    const iframeConfigs = {
        attention: {
            type: 'attention',
            src: 'visualisation/24715759',
            title: '关注度趋势图'
        },
        discussion: {
            type: 'discussion',
            src: 'visualisation/24715760', // 可以替换为不同的图表ID
            title: '讨论量分析图'
        },
        engagement: {
            type: 'engagement',
            src: 'visualisation/24715761', // 可以替换为不同的图表ID
            title: '参与度统计图'
        }
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => { 
                b.classList.remove('active'); 
                b.setAttribute('aria-selected', 'false'); 
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            const type = btn.getAttribute('data-chart');
            const config = iframeConfigs[type];
            
            if (config) {
                // 更新图表容器中的iframe
                updateChartIframe(config);
            }
        });
    });

    // 不自动清空内容，保持HTML中的默认iframe
    // const defaultConfig = iframeConfigs.attention;
    // if (defaultConfig) {
    //     updateChartIframe(defaultConfig);
    // }
}

function updateChartIframe(config) {
    const chartContent = document.getElementById('chartContent');
    if (!chartContent) return;

    // 清空现有内容
    chartContent.innerHTML = '';

    // 根据不同的图表类型显示对应的iframe代码
    if (config.type === 'attention') {
        chartContent.innerHTML = `
            <div class="flourish-embed flourish-bubble-chart" data-src="visualisation/24715759">
                <script src="https://public.flourish.studio/resources/embed.js"></script>
                <noscript>
                    <img src="https://public.flourish.studio/visualisation/24715759/thumbnail" width="100%" alt="bubble-chart visualization" />
                </noscript>
            </div>
        `;
    } else if (config.type === 'discussion') {
        chartContent.innerHTML = `
            <div class="flourish-embed flourish-bubble-chart" data-src="visualisation/24715760">
                <script src="https://public.flourish.studio/resources/embed.js"></script>
                <noscript>
                    <img src="https://public.flourish.studio/visualisation/24715760/thumbnail" width="100%" alt="discussion-chart visualization" />
                </noscript>
            </div>
        `;
    } else if (config.type === 'engagement') {
        chartContent.innerHTML = `
            <div class="flourish-embed flourish-bubble-chart" data-src="visualisation/24715761">
                <script src="https://public.flourish.studio/resources/embed.js"></script>
                <noscript>
                    <img src="https://public.flourish.studio/visualisation/24715761/thumbnail" width="100%" alt="engagement-chart visualization" />
                </noscript>
            </div>
        `;
    }
}

    // 初始状态
    if (el.verticalSlides?.length) {
        setActive(1);
        if (el.chapter1Indicators?.length) {
            el.chapter1Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setActive(idx + 1));
            });
        }
    }
    if (el.chapter4Slides?.length) {
        setChapter4Active(1);
        if (el.chapter4Indicators?.length) {
            el.chapter4Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setChapter4Active(idx + 1));
            });
        }
    }
    if (el.chapter2Slides?.length) {
        setChapter2Active(1);
        if (el.chapter2Indicators?.length) {
            el.chapter2Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setChapter2Active(idx + 1));
            });
        }
    }
    if (el.chapter3Slides?.length) {
        setChapter3Active(1);
        if (el.chapter3Indicators?.length) {
            el.chapter3Indicators.forEach((indicator, idx)=>{
                indicator.addEventListener('click', ()=> setChapter3Active(idx + 1));
            });
        }
    }

    // 初始化时检查分析部分可见性
    setTimeout(() => {
        checkAnalysisSectionVisibility();
    }, 100);

    // 添加Intersection Observer来更可靠地检测热度和技术界面的可见性
    const analysisObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const analysisSection = entry.target;
            const bottomRightImage = document.querySelector('.bottom-right-image');
            const topLeftImage = document.querySelector('.top-left-image');
            
            if (entry.isIntersecting) {
                // 界面进入视口，显示图片
                if (bottomRightImage) bottomRightImage.classList.add('show');
                if (topLeftImage) topLeftImage.classList.add('show');
            } else {
                // 界面离开视口，隐藏图片
                if (bottomRightImage) bottomRightImage.classList.remove('show');
                if (topLeftImage) topLeftImage.classList.remove('show');
            }
        });
    }, { 
        threshold: 0.1, // 当10%的界面可见时触发，让图片更早显示
        rootMargin: '0px 0px -50px 0px' // 减少提前触发的距离
    });

    // 观察热度和技术界面
    if (el.analysisSection) {
        analysisObserver.observe(el.analysisSection);
    }

    // 添加scroll事件监听器，确保在页面滚动时能正确检测
    window.addEventListener('scroll', () => {
        checkAnalysisSectionVisibility();
    }, { passive: true });

    // 移除字幕可视监听
});

// 文本框滑动出现逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 初始化：检查分析部分可见性，控制矢量图显示
    setTimeout(() => {
        checkAnalysisSectionVisibility();
    }, 100);
    
    const textBoxes = document.querySelectorAll('.text-box');
    const transitionSection = document.getElementById('transitionSection');
    const chapter2TransitionSection = document.getElementById('chapter2TransitionSection');
    
    // 初始化：隐藏所有文本框
    textBoxes.forEach(box => {
        box.classList.add('hide');
        box.classList.remove('show');
    });
    
    // 创建观察器，监听过渡页面是否进入视口
    const textBoxObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 页面进入视口后，开始显示文本框
                const sectionId = entry.target.id;
                if (sectionId === 'transitionSection') {
                    showTextBoxesSequentially(transitionSection);
                } else if (sectionId === 'chapter2TransitionSection') {
                    showTextBoxesSequentially(chapter2TransitionSection);
                } else if (sectionId === 'chapter3CustomCoverSection2') {
                    // 为第三幕自定义封面页面2添加动画效果
                    entry.target.classList.add('in-view');
                } else if (sectionId === 'customBackgroundSectionNews') {
                    // 为新闻页面添加动画效果
                    entry.target.classList.add('in-view');
                } else if (sectionId === 'sheIsNotSheSection') {
                    // 为她不是她页面添加动画效果
                    entry.target.classList.add('in-view');
                }
            } else {
                // 页面离开视口后的处理
                if (entry.target.id === 'chapter3CustomCoverSection2') {
                    entry.target.classList.remove('in-view');
                } else if (entry.target.id === 'customBackgroundSectionNews') {
                    entry.target.classList.remove('in-view');
                } else if (entry.target.id === 'sheIsNotSheSection') {
                    entry.target.classList.remove('in-view');
                } else if (entry.target.id === 'chapter2TransitionSection') {
                    // 第二章节过渡页面的文本框一旦显示就保持，不隐藏
                    // 不调用 hideAllTextBoxes()
                } else {
                    hideAllTextBoxes();
                }
            }
        });
    }, { 
        threshold: 0.3, // 当30%的页面可见时触发
        rootMargin: '0px 0px -50px 0px' // 适中的负边距
    });
    
    // 观察过渡页面
    if (transitionSection) {
        textBoxObserver.observe(transitionSection);
    }
    if (chapter2TransitionSection) {
        textBoxObserver.observe(chapter2TransitionSection);
    }
    
    // 观察新闻页面
    const customBackgroundSectionNews = document.getElementById('customBackgroundSectionNews');
    if (customBackgroundSectionNews) {
        textBoxObserver.observe(customBackgroundSectionNews);
    }
    
    // 观察她不是她页面
    const sheIsNotSheSection = document.getElementById('sheIsNotSheSection');
    if (sheIsNotSheSection) {
        textBoxObserver.observe(sheIsNotSheSection);
    }
    

    
         // 观察自定义背景页面
     const customBackgroundSection = document.getElementById('customBackgroundSection');
     if (customBackgroundSection) {
         textBoxObserver.observe(customBackgroundSection);
         
                   // 实现完整的动画流程：照片浮现→滑动后照片消失→文字浮现→进入下一页
          let animationPhase = 0;
          let lastScrollY = 0;
          let isAnimating = false;
          let animationComplete = false; // 防止动画完成后重复触发
          
          console.log('自定义背景页面动画逻辑已初始化');
          
          const handleCustomBackgroundScroll = () => {
              if (isAnimating || animationComplete) return; // 防止动画过程中重复触发或已完成
              
              const currentScrollY = window.pageYOffset;
              const scrollDelta = currentScrollY - lastScrollY;
              
              // 检查是否在视口中
              const rect = customBackgroundSection.getBoundingClientRect();
              const isInViewport = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
              
              if (isInViewport && scrollDelta > 20) { // 向下滚动超过20px
                  isAnimating = true;
                  
                  if (animationPhase === 0) {
                      // 第一阶段：显示图片
                      customBackgroundSection.classList.add('in-view');
                      animationPhase = 1;
                      console.log('第一阶段：图片显示');
                      
                      // 延迟重置动画状态，允许用户继续滚动
                      setTimeout(() => {
                          isAnimating = false;
                      }, 800);
                  } else if (animationPhase === 1) {
                      // 第二阶段：图片消失，显示文字
                      customBackgroundSection.classList.add('photo-hidden');
                      customBackgroundSection.classList.add('text-visible');
                      animationPhase = 2;
                      console.log('第二阶段：图片消失，文字显示');
                      
                      // 延迟进入下一页
                      setTimeout(() => {
                          console.log('动画完成，准备进入下一页');
                          animationComplete = true; // 标记动画完成
                          // 滚动到下一个页面
                          const nextSection = document.querySelector('#chapter3Section');
                          if (nextSection) {
                              nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                      }, 3000); // 文字显示3秒后进入下一页
                  }
              }
              
              lastScrollY = currentScrollY;
          };
         
         // 添加滚动事件监听器，使用节流
         let scrollTimeout;
         const throttledScrollHandler = () => {
             if (scrollTimeout) return;
             scrollTimeout = setTimeout(() => {
                 handleCustomBackgroundScroll();
                 scrollTimeout = null;
             }, 100);
         };
         
         window.addEventListener('scroll', throttledScrollHandler, { passive: true });
         
         // 页面进入视口时自动显示图片
         const customBackgroundObserver = new IntersectionObserver((entries) => {
             entries.forEach(entry => {
                 if (entry.isIntersecting) {
                     // 页面进入视口，显示图片
                     customBackgroundSection.classList.add('in-view');
                     console.log('自定义背景页面进入视口，图片显示');
                 }
             });
         }, { threshold: 0.3 });
         
         customBackgroundObserver.observe(customBackgroundSection);
     }
     
               // 观察第三幕自定义背景页面（简化版，只用于视口检测）
          const chapter3CustomBackgroundSection = document.getElementById('chapter3CustomBackgroundSection');
          if (chapter3CustomBackgroundSection) {
              textBoxObserver.observe(chapter3CustomBackgroundSection);
          }

          // 观察新增的自定义封面页面
          const customCoverSection1 = document.getElementById('customCoverSection1');
          const customCoverSection2 = document.getElementById('customCoverSection2');
          const customCoverSection3 = document.getElementById('customCoverSection3');
          const chapter3CustomCoverSection1 = document.getElementById('chapter3CustomCoverSection1');
          const chapter3CustomCoverSection2 = document.getElementById('chapter3CustomCoverSection2');

          if (customCoverSection1) textBoxObserver.observe(customCoverSection1);
          if (customCoverSection2) textBoxObserver.observe(customCoverSection2);
          if (customCoverSection3) textBoxObserver.observe(customCoverSection3);
          if (chapter3CustomCoverSection1) textBoxObserver.observe(chapter3CustomCoverSection1);
          if (chapter3CustomCoverSection2) textBoxObserver.observe(chapter3CustomCoverSection2);
    
    
    
    
    
    // 依次显示文本框的函数
    function showTextBoxesSequentially(section) {
        const boxes = section.querySelectorAll('.text-box');
        const customTextContainer = section.querySelector('.custom-text-container');
        
        console.log('showTextBoxesSequentially called for section:', section.id);
        console.log('Found text boxes:', boxes.length);
        
        if (boxes.length > 0) {
            // 处理文本框的浮现
            boxes.forEach((box, index) => {
                console.log('Showing text box', index, 'after', index * 800, 'ms');
                setTimeout(() => {
                    box.classList.remove('hide');
                    box.classList.add('show');
                    console.log('Text box', index, 'now has classes:', box.className);
                }, index * 800); // 每个文本框间隔800ms出现，总共约2.4秒
            });
        } else if (customTextContainer) {
            // 处理自定义背景页面的文本容器浮现
            setTimeout(() => {
                section.classList.add('in-view');
            }, 300); // 300ms后开始浮现
        }
    }
    
    // 隐藏所有文本框的函数
    function hideAllTextBoxes() {
        // 隐藏通用文本框
        textBoxes.forEach(box => {
            box.classList.add('hide');
            box.classList.remove('show');
        });
        
        // 不隐藏第二章节过渡页面的文本框，因为它们应该保持显示
        // const chapter2TextBoxes = document.querySelectorAll('#chapter2TransitionSection .text-box');
        // chapter2TextBoxes.forEach(box => {
        //     box.classList.add('hide');
        //     box.classList.remove('show');
        // });
    }
    
    // 重置文本框显示（可选：点击重置按钮时调用）
    window.resetTextBoxes = function() {
        hideAllTextBoxes();
        // 如果页面在视口中，重新显示
        if (transitionSection && isElementInViewport(transitionSection)) {
            setTimeout(() => showTextBoxesSequentially(transitionSection), 100);
        }
        if (chapter2TransitionSection && isElementInViewport(chapter2TransitionSection)) {
            setTimeout(() => showTextBoxesSequentially(chapter2TransitionSection), 100);
        }
    };
    
    // 检查元素是否在视口中的辅助函数
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
});

// 内容类型选择器功能
function initContentTypeSelector() {
    const buttons = document.querySelectorAll('.content-type-btn');
    const contentAreas = document.querySelectorAll('.content-area');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            
            // 更新按钮状态
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 显示对应内容区域
            contentAreas.forEach(area => {
                area.classList.remove('active');
                if (area.getAttribute('data-type') === type) {
                    area.classList.add('active');
                }
            });
        });
    });
}

// 初始化内容类型选择器
document.addEventListener('DOMContentLoaded', function() {
    initContentTypeSelector();
});

// 图片上传功能
function initImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'flex';
                document.querySelector('.image-upload-area').style.display = 'none';
                
                // 确保Flourish图表仍然可见
                const flourishChart = imagePreview.querySelector('.flourish-embed');
                if (flourishChart) {
                    flourishChart.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// 移除图片
function removeImage() {
    const imagePreview = document.getElementById('imagePreview');
    const imageUploadArea = document.querySelector('.image-upload-area');
    const imageUpload = document.getElementById('imageUpload');
    
    imagePreview.style.display = 'none';
    imageUploadArea.style.display = 'flex';
    imageUpload.value = ''; // 清空文件输入
}

// Tableau嵌入功能
function embedTableau() {
    const tableauUrl = document.getElementById('tableauUrl').value.trim();
    const tableauPreview = document.getElementById('tableauPreview');
    const tableauInputArea = document.querySelector('.tableau-input-area');
    
    if (!tableauUrl) {
        alert('请输入Tableau链接');
        return;
    }
    
    // 处理不同的Tableau链接格式
    let iframeSrc = tableauUrl;
    
    // 如果是完整的iframe代码，提取src
    if (tableauUrl.includes('<iframe')) {
        const srcMatch = tableauUrl.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
            iframeSrc = srcMatch[1];
        }
    }
    
    // 如果是Tableau分享链接，转换为嵌入链接
    if (tableauUrl.includes('tableau.com') && !iframeSrc.includes('embed')) {
        iframeSrc = tableauUrl.replace('/views/', '/embed/');
    }
    
    // 创建iframe
    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    // 清空预览区域并添加iframe，但保留Flourish图表
    const flourishChart = tableauPreview.querySelector('.flourish-embed');
    tableauPreview.innerHTML = '';
    tableauPreview.appendChild(iframe);
    
    // 重新添加Flourish图表
    if (flourishChart) {
        tableauPreview.appendChild(flourishChart.cloneNode(true));
    }
    
    // 显示预览，隐藏输入区域
    tableauPreview.style.display = 'flex';
    tableauInputArea.style.display = 'none';
}

// 代码嵌入功能（开发者使用）
function embedImageByCode(imageUrl, altText = '嵌入图片') {
    const imageContent = document.getElementById('imageContent');
    const chartContent = document.getElementById('chartContent');
    const previewImg = document.getElementById('previewImg');
    
    if (previewImg) {
        previewImg.src = imageUrl;
        previewImg.alt = altText;
    }
    
    // 隐藏图表，显示图片（图片区域现在也包含Flourish图表）
    chartContent.style.display = 'none';
    imageContent.style.display = 'block';
    
    // 确保Flourish图表在图片区域可见
    const flourishChart = imageContent.querySelector('.flourish-embed');
    if (flourishChart) {
        flourishChart.style.display = 'block';
    }
}

function embedTableauByCode(tableauUrl) {
    const tableauContent = document.getElementById('tableauContent');
    const chartContent = document.getElementById('chartContent');
    const tableauPreview = document.getElementById('tableauPreview');
    
    if (!tableauUrl) return;
    
    // 处理不同的Tableau链接格式
    let iframeSrc = tableauUrl;
    
    // 如果是完整的iframe代码，提取src
    if (tableauUrl.includes('<iframe')) {
        const srcMatch = tableauUrl.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
            iframeSrc = srcMatch[1];
        }
    }
    
    // 如果是Tableau分享链接，转换为嵌入链接
    if (tableauUrl.includes('tableau.com') && !iframeSrc.includes('embed')) {
        iframeSrc = tableauUrl.replace('/views/', '/embed/');
    }
    
    // 创建iframe
    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    // 清空预览区域并添加iframe，但保留文本框和Flourish图表
    const textOverlay = tableauPreview.querySelector('.tableau-text-overlay');
    const flourishChart = tableauPreview.querySelector('.flourish-embed');
    tableauPreview.innerHTML = '';
    tableauPreview.appendChild(iframe);
    if (textOverlay) {
        tableauPreview.appendChild(textOverlay);
    }
    if (flourishChart) {
        tableauPreview.appendChild(flourishChart.cloneNode(true));
    }
    
    // 隐藏图表，显示Tableau（Tableau区域现在也包含Flourish图表）
    chartContent.style.display = 'none';
    tableauContent.style.display = 'block';
}

function showChart() {
    const imageContent = document.getElementById('imageContent');
    const tableauContent = document.getElementById('tableauContent');
    const chartContent = document.getElementById('chartContent');
    
    // 隐藏其他内容，显示图表
    imageContent.style.display = 'none';
    tableauContent.style.display = 'none';
    chartContent.style.display = 'block';
    
    // 现在所有区域都显示Flourish图表，无需重新渲染
}

// 将函数暴露到全局作用域，供开发者使用
window.embedImageByCode = embedImageByCode;
window.embedTableauByCode = embedTableauByCode;
window.showChart = showChart;

// 添加一个测试函数来显示Tableau内容
function showTableauContent() {
    const imageContent = document.getElementById('imageContent');
    const tableauContent = document.getElementById('tableauContent');
    const chartContent = document.getElementById('chartContent');
    
    // 隐藏其他内容，显示Tableau
    imageContent.style.display = 'none';
    chartContent.style.display = 'none';
    tableauContent.style.display = 'block';
}

window.showTableauContent = showTableauContent;

// Coco AI复活伦理问题页面功能
function showCocoPage() {
    const page = document.getElementById('cocoPage');
    if (page) {
        page.style.display = 'block';
        page.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 启动动画序列
        setTimeout(() => {
            startCocoAnimation();
        }, 500);
    }
}

// 乔任梁 AI复活伦理问题页面功能
function showQiaoPage() {
    const page = document.getElementById('qiaoPage');
    if (page) {
        page.style.display = 'block';
        page.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 启动动画序列
        setTimeout(() => {
            startQiaoAnimation();
        }, 500);
    }
}

// 高以翔 AI复活伦理问题页面功能
function showGaoPage() {
    const page = document.getElementById('gaoPage');
    if (page) {
        page.style.display = 'block';
        page.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 启动动画序列
        setTimeout(() => {
            startGaoAnimation();
        }, 500);
    }
}

function hideCocoPage() {
    const page = document.getElementById('cocoPage');
    hidePage(page);
}

function hideQiaoPage() {
    const page = document.getElementById('qiaoPage');
    hidePage(page);
}

function hideGaoPage() {
    const page = document.getElementById('gaoPage');
    hidePage(page);
}

function goBack() {
    // 隐藏所有页面
    const allPages = ['cocoPage', 'qiaoPage', 'gaoPage', 'staffPage'];
    allPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page && (page.style.display === 'block' || page.classList.contains('show'))) {
            if (pageId === 'staffPage') {
                hideStaffPage();
            } else {
                hidePage(page);
            }
        }
    });
}

// 通用的隐藏页面函数
function hidePage(page) {
    if (page) {
        page.classList.remove('show');
        setTimeout(() => {
            page.style.display = 'none';
            // 重置页面状态
            page.classList.remove('in-view', 'photo-hidden', 'text-visible');
        }, 500);
        document.body.style.overflow = 'auto'; // 恢复背景滚动
    }
}

// Coco页面动画序列
function startCocoAnimation() {
    const page = document.getElementById('cocoPage');
    if (!page) return;
    
    // 第一阶段：显示图片
    page.classList.add('in-view');
    
    // 第二阶段：图片消失，显示文字
    setTimeout(() => {
        page.classList.add('photo-hidden');
        page.classList.add('text-visible');
    }, 2000);
}

// 乔任梁页面动画序列
function startQiaoAnimation() {
    const page = document.getElementById('qiaoPage');
    if (!page) return;
    
    // 第一阶段：显示图片
    page.classList.add('in-view');
    
    // 第二阶段：图片消失，显示文字
    setTimeout(() => {
        page.classList.add('photo-hidden');
        page.classList.add('text-visible');
    }, 2000);
}

// 高以翔页面动画序列
function startGaoAnimation() {
    const page = document.getElementById('gaoPage');
    if (!page) return;
    
    // 第一阶段：显示图片
    page.classList.add('in-view');
    
    // 第二阶段：图片消失，显示文字
    setTimeout(() => {
        page.classList.add('photo-hidden');
        page.classList.add('text-visible');
    }, 2000);
}

// 重置Coco页面动画
function resetCocoAnimation() {
    const page = document.getElementById('cocoPage');
    if (page) {
        page.classList.remove('in-view', 'photo-hidden', 'text-visible');
    }
}



// 将函数暴露到全局作用域
window.showCocoPage = showCocoPage;
window.showQiaoPage = showQiaoPage;
window.showGaoPage = showGaoPage;
window.hideCocoPage = hideCocoPage;
window.hideQiaoPage = hideQiaoPage;
window.hideGaoPage = hideGaoPage;
window.goBack = goBack;
window.resetCocoAnimation = resetCocoAnimation;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // ESC键返回
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // 检查是否有任何页面显示
            const allPages = ['cocoPage', 'qiaoPage', 'gaoPage', 'staffPage'];
            const visiblePage = allPages.find(pageId => {
                const page = document.getElementById(pageId);
                return page && (page.style.display === 'block' || page.classList.contains('show'));
            });
            
            if (visiblePage) {
                goBack();
            }
        }
    });
    
    // 初始化Coco页面文本框
    initCocoTextBoxes();
});

// 初始化所有页面文本框
function initCocoTextBoxes() {
    const allPages = ['cocoPage', 'qiaoPage', 'gaoPage'];
    
    allPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            const textBoxes = page.querySelectorAll('.text-box');
            
            // 初始化：隐藏所有文本框
            textBoxes.forEach(box => {
                box.classList.add('hide');
                box.classList.remove('show');
            });
            
            // 当页面变为text-visible状态时，依次显示文本框
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (page.classList.contains('text-visible')) {
                            showTextBoxesSequentiallyForPage(pageId);
                        }
                    }
                });
            });
            
            observer.observe(page, { attributes: true });
        }
    });
}

// 依次显示指定页面的文本框
function showTextBoxesSequentiallyForPage(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;
    
    const textBoxes = page.querySelectorAll('.text-box');
    
    // 显示所有文本框
    textBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.remove('hide');
            box.classList.add('show');
        }, index * 800); // 每个文本框间隔800ms出现
    });
}

// 保持向后兼容
function showCocoTextBoxesSequentially() {
    showTextBoxesSequentiallyForPage('cocoPage');
}

// 显示制作团队页面
function showStaffPage() {
    const staffPage = document.getElementById('staffPage');
    if (staffPage) {
        staffPage.classList.add('show');
        staffPage.style.display = 'block';
    }
}

// 隐藏制作团队页面
function hideStaffPage() {
    const staffPage = document.getElementById('staffPage');
    if (staffPage) {
        staffPage.classList.remove('show');
        staffPage.style.display = 'none';
    }
}

// 将制作团队页面函数暴露到全局作用域
window.showStaffPage = showStaffPage;
window.hideStaffPage = hideStaffPage;

// 新闻页面交互函数
function showLiuDehuaNews() {
    const floatingImage = document.getElementById('liuDehuaFloatingImage');
    const quoteTextBox = document.querySelector('#newsLiuDehuaSection .quote-text-box-1');
    
    if (floatingImage) {
        floatingImage.classList.add('show');
        // 照片浮现后保持显示，不自动消失
    }
    
    // 文本框与图片一起出现
    if (quoteTextBox) {
        setTimeout(() => {
            quoteTextBox.style.opacity = '1';
            quoteTextBox.style.transform = 'translateY(0)';
        }, 500); // 延迟500毫秒出现，与图片动画同步
    }
}

function showBaoNews() {
    const floatingImage = document.getElementById('baoFloatingImage');
    const quoteTextBox = document.querySelector('#newsBaoSection .quote-text-box-2');
    
    if (floatingImage) {
        floatingImage.classList.add('show');
        // 照片浮现后保持显示，不自动消失
    }
    
    // 文本框与图片一起出现
    if (quoteTextBox) {
        setTimeout(() => {
            quoteTextBox.style.opacity = '1';
            quoteTextBox.style.transform = 'translateY(0)';
        }, 500); // 延迟500毫秒出现，与图片动画同步
    }
}

// 将新闻交互函数暴露到全局作用域
window.showLiuDehuaNews = showLiuDehuaNews;
window.showBaoNews = showBaoNews;

// 第三幕自定义封面页面1的图表切换功能
function initChapter3ChartSwitch() {
    const wordCloudChart = document.getElementById('wordCloudChart');
    const mapChart = document.getElementById('mapChart');
    const section = document.getElementById('chapter3CustomCoverSection1');
    const mapButton = document.getElementById('mapButton');
    const wordCloudButton = document.getElementById('wordCloudButton');
    
    if (!wordCloudChart || !mapChart || !section || !mapButton || !wordCloudButton) {
        console.log('图表切换初始化失败：缺少必要元素');
        return;
    }
    
    let isTransitioning = false;
    
    console.log('图表切换功能初始化成功');
    console.log('初始状态：显示map图表');
    
    // 确保初始状态正确
    mapChart.style.display = 'block';
    mapChart.style.opacity = '1';
    wordCloudChart.style.display = 'none';
    wordCloudChart.style.opacity = '0';
    
    // 设置初始按钮状态
    mapButton.classList.add('active');
    wordCloudButton.classList.remove('active');
    
    // 监听地图按钮点击事件
    mapButton.addEventListener('click', function() {
        if (isTransitioning) {
            console.log('正在过渡中，忽略点击');
            return;
        }
        
        console.log('地图按钮点击，切换到地图视图');
        switchToChart(mapChart, wordCloudChart, mapButton, wordCloudButton);
    });
    
    // 监听词云按钮点击事件
    wordCloudButton.addEventListener('click', function() {
        if (isTransitioning) {
            console.log('正在过渡中，忽略点击');
            return;
        }
        
        console.log('词云按钮点击，切换到词云视图');
        switchToChart(wordCloudChart, mapChart, wordCloudButton, mapButton);
    });
    
    // 图表切换函数
    function switchToChart(showChart, hideChart, activeButton, inactiveButton) {
        isTransitioning = true;
        
        // 隐藏当前图表
        hideChart.style.opacity = '0';
        
        setTimeout(() => {
            hideChart.style.display = 'none';
            
            // 显示目标图表
            showChart.style.display = 'block';
            
            setTimeout(() => {
                showChart.style.opacity = '1';
                
                // 更新按钮状态
                activeButton.classList.add('active');
                inactiveButton.classList.remove('active');
                
                setTimeout(() => {
                    isTransitioning = false;
                    console.log('图表切换完成');
                }, 200);
            }, 50);
        }, 500);
    }
}

// 页面加载完成后初始化图表切换功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化图表切换功能');
    setTimeout(() => {
        initChapter3ChartSwitch();
    }, 1000); // 延迟1秒初始化，确保所有元素都已加载
});

// 也监听window的load事件作为备用
window.addEventListener('load', function() {
    console.log('页面完全加载完成，再次尝试初始化图表切换功能');
    initChapter3ChartSwitch();
});

// Ending页面交互功能
function initEndingInteraction() {
    console.log('开始初始化Ending页面交互功能...');
    
    const endingButton = document.getElementById('endingButton');
    const photosContainer = document.getElementById('endingPhotosContainer');
    const newBackground = document.getElementById('endingNewBackground');
    
    console.log('找到的元素:', {
        endingButton: endingButton,
        photosContainer: photosContainer,
        newBackground: newBackground
    });
    
    if (!endingButton) {
        console.error('Ending页面交互初始化失败：找不到endingButton元素');
        return;
    }
    
    if (!photosContainer) {
        console.error('Ending页面交互初始化失败：找不到endingPhotosContainer元素');
        return;
    }
    
    if (!newBackground) {
        console.error('Ending页面交互初始化失败：找不到endingNewBackground元素');
        return;
    }
    
    console.log('Ending页面交互功能初始化成功');
    
    // 添加按钮点击事件监听器
    endingButton.addEventListener('click', function(e) {
        console.log('Ending按钮被点击！');
        
        // 防止重复触发
        if (endingButton.classList.contains('transitioning')) {
            console.log('正在过渡中，忽略点击');
            return;
        }
        
        console.log('Ending按钮被点击，开始照片消失和背景切换动画');
        
        // 标记正在过渡中
        endingButton.classList.add('transitioning');
        
        // 隐藏按钮
        endingButton.classList.add('hide');
        
        // 获取所有照片
        const photos = photosContainer.querySelectorAll('.ending-photo');
        console.log('找到照片数量:', photos.length);
        
        // 为每张照片添加消失动画类
        photos.forEach((photo, index) => {
            setTimeout(() => {
                photo.classList.add('fade-out');
                console.log(`照片 ${index + 1} 开始消失动画`);
            }, index * 200); // 每张照片间隔200ms消失
        });
        
        // 等待所有照片消失动画完成后，开始背景切换
        setTimeout(() => {
            console.log('开始背景切换阶段...');
            
            // 隐藏照片容器
            photosContainer.style.opacity = '0';
            photosContainer.style.transform = 'scale(0.8)';
            console.log('照片容器隐藏完成');
            
            // 确保新背景元素存在且可见
            console.log('新背景元素状态:', {
                element: newBackground,
                opacity: window.getComputedStyle(newBackground).opacity,
                zIndex: window.getComputedStyle(newBackground).zIndex,
                display: window.getComputedStyle(newBackground).display
            });
            
            // 显示新背景 - 使用更明显的动画效果
            newBackground.style.opacity = '1';
            newBackground.style.transform = 'scale(1)';
            console.log('新背景显示完成');
            
            // 检查新背景是否真的显示了
            setTimeout(() => {
                const finalOpacity = window.getComputedStyle(newBackground).opacity;
                console.log('新背景最终透明度:', finalOpacity);
                if (finalOpacity > 0) {
                    console.log('背景切换成功！');
                } else {
                    console.log('背景切换失败，透明度仍为0');
                }
            }, 100);
            
            console.log('背景切换完成');
        }, photos.length * 200 + 1000); // 等待所有照片消失 + 1秒
    });
    
    // 测试按钮是否可点击
    console.log('按钮样式:', window.getComputedStyle(endingButton));
    console.log('按钮位置:', endingButton.getBoundingClientRect());
}

// 页面加载完成后初始化Ending页面交互功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化Ending页面交互功能');
    setTimeout(() => {
        initEndingInteraction();
    }, 500);
});

// 也监听window的load事件作为备用
window.addEventListener('load', function() {
    console.log('页面完全加载完成，再次尝试初始化Ending页面交互功能');
    setTimeout(() => {
        initEndingInteraction();
    }, 100);
});

// 立即尝试初始化（如果DOM已经准备好）
if (document.readyState === 'loading') {
    console.log('DOM还在加载中，等待DOMContentLoaded事件');
} else {
    console.log('DOM已经准备好，立即初始化');
    initEndingInteraction();
}



