(function () {
    'use strict';

    window.createAdminPdfModule = function createAdminPdfModule(deps) {
        const { showToast } = deps;

        const PDF_BASE_CSS = `
            .pdf-page {
                width: 794px;
                min-height: 1123px;
                background: #ffffff;
                font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                direction: rtl;
                padding: 40px 50px 80px;
                box-sizing: border-box;
                position: relative;
                color: #1a2e44;
            }
            .pdf-frame-outer {
                position: absolute;
                inset: 16px;
                border: 2px solid #1a3a5c;
                pointer-events: none;
                border-radius: 4px;
            }
            .pdf-frame-inner {
                position: absolute;
                inset: 20px;
                border: 1px solid #c8a45a;
                pointer-events: none;
                border-radius: 2px;
            }
            .pdf-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .pdf-header p {
                margin: 0 0 2px;
            }
            .pdf-head-l1 {
                font-size: 13px;
                font-weight: 700;
                color: #1a3a5c;
            }
            .pdf-head-l2 {
                font-size: 12px;
                color: #555;
            }
            .pdf-head-l3 {
                font-size: 12px;
                font-weight: 600;
                color: #1a3a5c;
            }
            .pdf-head-l4 {
                font-size: 11px;
                color: #555;
                margin: 0;
            }
            .pdf-header-sep {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 12px auto;
                width: 70%;
            }
            .pdf-header-sep .line {
                flex: 1;
                height: 1px;
                background: #c8a45a;
            }
            .pdf-header-sep .diamond {
                width: 6px;
                height: 6px;
                background: #c8a45a;
                transform: rotate(45deg);
                flex-shrink: 0;
            }
            .pdf-title {
                font-size: 16px;
                font-weight: 700;
                color: #1a3a5c;
                margin: 0 0 6px;
            }
            .pdf-subtitle {
                font-size: 11px;
                color: #777;
                margin: 0;
            }
            .pdf-name-box {
                background: linear-gradient(135deg, #1a3a5c, #2c5282);
                color: #fff;
                text-align: center;
                padding: 10px 20px;
                border-radius: 4px;
                margin-bottom: 18px;
                font-size: 15px;
                font-weight: 700;
            }
            .pdf-tbl {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                margin-bottom: 14px;
            }
            .pdf-tbl .lbl {
                padding: 6px 10px;
                background: #eef1f6;
                color: #1a3a5c;
                font-weight: 700;
                border: 1px solid #c8d0db;
                white-space: nowrap;
                width: 14%;
            }
            .pdf-tbl .val {
                padding: 6px 12px;
                color: #1a2e44;
                border: 1px solid #c8d0db;
                word-break: break-word;
            }
            .pdf-section {
                padding: 6px 12px;
                background: #1a3a5c;
                color: #fff;
                font-weight: 700;
                font-size: 11.5px;
                border-right: 4px solid #c8a45a;
            }
            .pdf-signatures {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 20px;
                padding-top: 14px;
                border-top: 1px solid #dde3ed;
                font-size: 11px;
                color: #666;
            }
            .pdf-signoff {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .sig-block {
                text-align: center;
                min-width: 160px;
            }
            .sig-block p {
                margin: 0 0 32px;
            }
            .sig-line {
                border-top: 1px solid #aaa;
                width: 120px;
                margin: 0 auto;
            }
            .sig-sub {
                margin: 4px 0 0 !important;
                font-size: 10px;
                color: #999;
            }
            .pdf-issue-date {
                text-align: center;
                font-size: 10px;
                color: #aaa;
            }
            .pdf-footer {
                text-align: center;
                font-size: 9px;
                color: #bbb;
                border-top: 1px solid #eee;
                padding-top: 6px;
                margin-top: 12px;
            }
        `;

        const PDF_ADMIN_EXTRA_CSS = `
            .tt-wrap {
                margin-bottom: 14px;
            }
            .tt-title {
                background: #1a3a5c;
                color: #fff;
                padding: 6px 12px;
                font-weight: 700;
                font-size: 11.5px;
                border-right: 4px solid #c8a45a;
            }
            .tt-title small {
                font-size: 10px;
                font-weight: 400;
                color: #c8a45a;
                margin-right: 12px;
            }
            .tt-tbl {
                width: 100%;
                border-collapse: collapse;
                font-size: 10.5px;
            }
            .tt-hdr {
                background: #1a3a5c;
                color: #fff;
                padding: 5px 4px;
                text-align: center;
                border: 1px solid #2c5282;
                font-weight: 600;
                font-size: 10px;
            }
            .tt-hdr.w60 {
                width: 60px;
            }
            .tt-hdr.w36 {
                width: 36px;
            }
            .tt-period {
                background: #2c5282;
                color: #fff;
                padding: 4px;
                text-align: center;
                border: 1px solid #2c5282;
                font-size: 10px;
            }
            .tt-day {
                background: #eef1f6;
                color: #1a3a5c;
                font-weight: 700;
                padding: 5px 8px;
                border: 1px solid #c8d0db;
                text-align: center;
                white-space: nowrap;
            }
            .tt-slot {
                padding: 5px 4px;
                border: 1px solid #c8d0db;
                text-align: center;
                min-width: 56px;
            }
            .tt-break {
                background: #f7f9fc;
                border: 1px solid #c8d0db;
                width: 36px;
            }
        `;

        const PDF_INSPECTION_EXTRA_CSS = `
            .note-highlight {
                font-weight: 700;
                font-size: 13px;
                color: #1a3a5c;
            }
            .obs-wrap {
                margin-top: 14px;
            }
            .obs-section {
                margin-top: 10px;
            }
            .obs-title {
                background: #eef1f6;
                color: #1a3a5c;
                border: 1px solid #c8d0db;
                border-right: 4px solid #c8a45a;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 700;
            }
            .obs-item {
                border: 1px solid #d8dee8;
                border-top: 0;
                padding: 6px 10px;
                font-size: 10.5px;
                line-height: 1.7;
                color: #1a2e44;
            }
            .obs-item-label {
                font-weight: 700;
                color: #1a3a5c;
            }
            .obs-item-comment {
                margin-top: 3px;
                color: #48556a;
                font-size: 10px;
            }
            .obs-inline {
                border: 1px solid #d8dee8;
                border-top: 0;
                padding: 6px 10px;
                font-size: 10.5px;
                line-height: 1.9;
                color: #1a2e44;
                display: flex;
                flex-wrap: wrap;
                gap: 4px 8px;
            }
            .obs-inline .obs-sep {
                color: #94a3b8;
            }
            .obs-empty {
                border: 1px dashed #c8d0db;
                background: #f7f9fc;
                color: #6b7280;
                padding: 10px;
                text-align: center;
                font-size: 10.5px;
                margin-top: 8px;
            }
            .eval-wrap {
                margin-top: 14px;
            }
            .eval-card {
                border: 1px solid #c8d0db;
                border-radius: 4px;
                margin-top: 10px;
                overflow: hidden;
            }
            .eval-card-header {
                background: #1a3a5c;
                color: #fff;
                padding: 6px 12px;
                font-size: 11.5px;
                font-weight: 700;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .eval-card-score {
                background: rgba(255,255,255,.15);
                border-radius: 20px;
                padding: 2px 12px;
                font-size: 10.5px;
                font-weight: 700;
            }
            .eval-sec-title {
                background: #eef1f6;
                color: #1a3a5c;
                border: 1px solid #c8d0db;
                border-top: none;
                border-right: 4px solid #c8a45a;
                padding: 5px 10px;
                font-size: 11px;
                font-weight: 700;
            }
            .eval-sec-contenu {
                border: 1px solid #d8dee8;
                border-top: none;
                padding: 5px 10px;
                font-size: 10.5px;
                color: #48556a;
                font-style: italic;
            }
            .eval-sec-item {
                border: 1px solid #d8dee8;
                border-top: none;
                padding: 5px 10px;
                font-size: 10.5px;
                line-height: 1.7;
                color: #1a2e44;
            }
            .eval-empty {
                padding: 8px 12px;
                color: #94a3b8;
                font-style: italic;
                font-size: 10.5px;
            }
        `;

        const PDF_BUTTON_LOADING_TEXT = '…';
        const PDF_BUTTON_DEFAULT_TEXT = '↓ PDF';

        function toText(value) {
            return value !== null && value !== undefined ? String(value) : '';
        }

        function toDatePart(value) {
            return toText(value).split('T')[0];
        }

        function formatDate(iso) {
            if (!iso) return '—';
            const part = toDatePart(iso);
            if (!part.includes('-')) return part || '—';
            const [y, m, d] = part.split('-');
            if (!y || !m || !d) return part || '—';
            return `${d}/${m}/${y}`;
        }

        function recordToData(r) {
            return {
                district             : toText(r.district),
                schoolYear           : toText(r.school_year),
                schoolName           : toText(r.school_name),
                yearsWorked          : toText(r.years_worked),
                firstName            : toText(r.first_name),
                familyName           : toText(r.family_name),
                maidenName           : toText(r.maiden_name),
                birthDate            : toDatePart(r.birth_date),
                birthPlace           : toText(r.birth_place),
                residence            : toText(r.residence),
                gender               : toText(r.gender),
                maritalStatus        : toText(r.marital_status),
                childrenCount        : toText(r.children_count),
                spouseName           : toText(r.spouse_name),
                phone                : toText(r.phone),
                email                : toText(r.email),
                schoolEntryDate      : toDatePart(r.school_entry_date),
                diploma              : toText(r.diploma),
                techInstituteGradYear: toText(r.tech_institute_grad_year),
                universityGradYear   : toText(r.university_grad_year),
                firstAppointmentDate : toDatePart(r.first_appointment_date),
                job_rank             : toText(r.job_rank),
                status               : toText(r.status),
                lastInspectionDate   : toDatePart(r.last_inspection_date),
                lastInspectionScore  : toText(r.last_inspection_score),
                echelon              : toText(r.echelon),
                grade                : toText(r.grade),
                executionDate        : toDatePart(r.execution_date),
                latestInspectionDate : toDatePart(r.latest_inspection_date),
                latestInspectionScore: toText(r.latest_inspection_score),
                previousYearClass    : toText(r.previous_year_class),
                currentYearClass     : toText(r.current_year_class),
                studentCount         : toText(r.student_count),
                haraka               : toText(r.haraka),
                classNote            : toText(r.class_note),
                timetable            : [],
            };
        }

        function sectionRow(title) {
            return `
                <tr>
                    <td colspan="6" class="pdf-section">${title}</td>
                </tr>`;
        }

        function fullRow(label, value) {
            return `
                <tr>
                    <td class="lbl" colspan="2">${label}</td>
                    <td class="val" colspan="4">${value || '—'}</td>
                </tr>`;
        }

        function dualRow(l1, v1, l2, v2) {
            return `
                <tr>
                    <td class="lbl">${l1}</td>
                    <td class="val" colspan="2">${v1 || '—'}</td>
                    <td class="lbl">${l2}</td>
                    <td class="val" colspan="2">${v2 || '—'}</td>
                </tr>`;
        }

        function triRow(l1, v1, l2, v2, l3, v3) {
            return `
                <tr>
                    <td class="lbl">${l1}</td>
                    <td class="val">${v1 || '—'}</td>
                    <td class="lbl">${l2}</td>
                    <td class="val">${v2 || '—'}</td>
                    <td class="lbl">${l3}</td>
                    <td class="val">${v3 || '—'}</td>
                </tr>`;
        }

        function buildHeaderBlock(title, subtitle) {
            return `
                <div class="pdf-header">
                    <p class="pdf-head-l1">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p class="pdf-head-l2">وزارة التربية الوطنية</p>
                    <p class="pdf-head-l3">مديرية التربية لولاية بسكرة</p>
                    <p class="pdf-head-l4">مفتشية التعليم الابتدائي</p>
                    <div class="pdf-header-sep">
                        <div class="line"></div>
                        <div class="diamond"></div>
                        <div class="line"></div>
                    </div>
                    <h1 class="pdf-title">${title}</h1>
                    <p class="pdf-subtitle">${subtitle}</p>
                </div>`;
        }

        function buildSignatureBlock() {
            return `
                <div class="pdf-signoff">
                    <div class="pdf-signatures">
                        <div class="sig-block">
                            <p>الأستاذ / الأستاذة</p>
                            <div class="sig-line"></div>
                            <p class="sig-sub">التوقيع</p>
                        </div>
                        <div class="sig-block">
                            <p>المفتش</p>
                            <div class="sig-line"></div>
                            <p class="sig-sub">التوقيع والختم</p>
                            <p class="pdf-issue-date">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-DZ')}</p>
                        </div>
                    </div>
                    <!--<div class="pdf-footer">سماح علمي — جميع الحقوق محفوظة — 2026</div>-->
                </div>`;
        }

        function wrapPdfPage(pageId, extraCss, content) {
            return `
                <style>${PDF_BASE_CSS}${extraCss || ''}</style>
                <div id="${pageId}" class="pdf-page">
                    <div class="pdf-frame-outer"></div>
                    <div class="pdf-frame-inner"></div>
                    ${content}
                </div>`;
        }

        function createHiddenWrapper(html) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
            wrapper.innerHTML = html;
            document.body.appendChild(wrapper);
            return wrapper;
        }

        function setPdfButtonState(btn, isLoading) {
            if (!btn) {
                return;
            }
            btn.disabled = isLoading;
            btn.textContent = isLoading ? PDF_BUTTON_LOADING_TEXT : PDF_BUTTON_DEFAULT_TEXT;
        }

        async function exportTemplateToPdf(templateEl, fileName, options = {}) {
            const scale = options.scale || 2;
            const breakSelectors = Array.isArray(options.breakSelectors) ? options.breakSelectors : [];
            const avoidOrphanSelectors = Array.isArray(options.avoidOrphanSelectors) ? options.avoidOrphanSelectors : [];

            const canvas = await html2canvas(templateEl, {
                scale,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: templateEl.scrollWidth,
                height: templateEl.scrollHeight,
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const usableW = pageW - margin * 2;
            const imgH = (canvas.height * usableW) / canvas.width;

            const maxSrcH = ((pageH - margin * 2) * canvas.width) / usableW;
            const srcScale = canvas.height / Math.max(1, templateEl.scrollHeight);

            const breakPoints = [];
            if (breakSelectors.length) {
                breakSelectors.forEach(selector => {
                    templateEl.querySelectorAll(selector).forEach(node => {
                        const bottom = (node.offsetTop + node.offsetHeight) * srcScale;
                        if (bottom > 0 && bottom < canvas.height) {
                            breakPoints.push(Math.round(bottom));
                        }
                    });
                });
            }

            const sortedBreaks = Array.from(new Set(breakPoints)).sort((a, b) => a - b);
            const minChunk = Math.max(120, Math.round(maxSrcH * 0.35));

            // Forbidden break zones: don't break just before an avoidOrphan element
            const orphanBuffer = Math.round(maxSrcH * 0.20);
            const forbiddenZones = [];
            avoidOrphanSelectors.forEach(sel => {
                templateEl.querySelectorAll(sel).forEach(node => {
                    const top = Math.round(node.offsetTop * srcScale);
                    forbiddenZones.push({ start: Math.max(0, top - orphanBuffer), end: top });
                });
            });

            let srcY = 0;
            let pageIndex = 0;
            while (srcY < canvas.height) {
                const hardEnd = Math.min(canvas.height, Math.round(srcY + maxSrcH));
                let candidate = sortedBreaks.filter(bp => bp > srcY + minChunk && bp <= hardEnd);
                if (forbiddenZones.length) {
                    candidate = candidate.filter(bp => !forbiddenZones.some(z => bp >= z.start && bp <= z.end));
                }
                let endY = candidate.length ? candidate[candidate.length - 1] : hardEnd;

                // Check 1: if hardEnd is inside a forbidden zone, pull back to before the zone
                if (endY === hardEnd && endY < canvas.height && forbiddenZones.length) {
                    for (const z of forbiddenZones) {
                        if (hardEnd > z.start && hardEnd <= z.end) {
                            const earlier = sortedBreaks.filter(bp => bp > srcY + minChunk && bp < z.start && !forbiddenZones.some(fz => bp >= fz.start && bp <= fz.end));
                            if (earlier.length) endY = earlier[earlier.length - 1];
                            break;
                        }
                    }
                }

                // Check 2: if cutting here leaves a tiny orphan sliver as the FINAL page, absorb it
                if (endY < canvas.height) {
                    const remaining = canvas.height - endY;
                    if (remaining < maxSrcH * 0.15 && canvas.height - srcY <= maxSrcH) {
                        // The sliver + this page combined still fit on one page — absorb it
                        endY = canvas.height;
                    }
                }

                const srcH = Math.max(1, endY - srcY);
                const sliceH = (srcH * usableW) / canvas.width;

                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = srcH;
                sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

                if (pageIndex > 0) {
                    pdf.addPage();
                }
                pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, usableW, sliceH);

                srcY = endY;
                pageIndex += 1;
            }

            pdf.save(fileName);
        }

        function buildAdminPDFTemplate(data) {
            const fullName = [data.familyName, data.firstName, data.maidenName ? `(${data.maidenName})` : '']
                .filter(Boolean)
                .join(' ');

            const ttRows = (data.timetable || []).map(r => `
                <tr>
                    <td class="tt-day">${r.day}</td>
                    ${r.slots.slice(0, 4).map(s => `<td class="tt-slot">${s}</td>`).join('')}
                    <td class="tt-break"></td>
                    ${r.slots.slice(4).map(s => `<td class="tt-slot">${s}</td>`).join('')}
                </tr>`).join('');

            const timetableBlock = data.timetable && data.timetable.length
                ? `
                <div class="tt-wrap">
                    <div class="tt-title">
                        التوزيع الأسبوعي
                        <small>الفترة الصباحية: 4 حصص &nbsp;|&nbsp; الفترة المسائية: 3 حصص</small>
                    </div>
                    <table class="tt-tbl">
                        <thead>
                            <tr>
                                <th class="tt-hdr w60" rowspan="2">الأيام</th>
                                <th class="tt-period" colspan="4">الفترة الصباحية</th>
                                <th class="tt-hdr w36" rowspan="2">استراحة</th>
                                <th class="tt-period" colspan="3">الفترة المسائية</th>
                            </tr>
                            <tr>
                                <th class="tt-hdr">1</th><th class="tt-hdr">2</th><th class="tt-hdr">3</th><th class="tt-hdr">4</th>
                                <th class="tt-hdr">5</th><th class="tt-hdr">6</th><th class="tt-hdr">7</th>
                            </tr>
                        </thead>
                        <tbody>${ttRows}</tbody>
                    </table>
                </div>`
                : '';

            const html = wrapPdfPage(
                'adminPdfTemplate',
                PDF_ADMIN_EXTRA_CSS,
                `
                    ${buildHeaderBlock('البطاقة الشخصية لأستاذ اللغة العربية', 'يرجى ملء جميع الحقول المطلوبة بدقة')}
                    <div class="pdf-name-box">${fullName}</div>
                    <table class="pdf-tbl">
                        ${sectionRow('المعلومات المدرسية')}
                        ${dualRow('المقاطعة المدرسية', data.district, 'العام الدراسي', data.schoolYear)}
                        ${dualRow('اسم المدرسة', data.schoolName, 'عدد سنوات العمل فيها', data.yearsWorked)}

                        ${sectionRow('المعلومات الشخصية')}
                        ${fullRow('مكان الإقامة', data.residence)}
                        ${fullRow('الجنس', data.gender)}
                        ${triRow('الاسم الشخصي', data.firstName, 'الاسم العائلي', data.familyName, 'اللقب الأصلي للمتزوجة', data.maidenName)}
                        ${dualRow('تاريخ الميلاد', formatDate(data.birthDate), 'مكان الميلاد', data.birthPlace)}
                        ${data.maritalStatus ? fullRow('الحالة المدنية', data.maritalStatus) : ''}
                        ${data.childrenCount !== '' ? fullRow('عدد الأطفال', data.childrenCount) : ''}
                        ${data.spouseName ? fullRow('إسم و لقب الزوج', data.spouseName) : ''}

                        ${sectionRow('معلومات الاتصال')}
                        ${fullRow('رقم الهاتف', data.phone)}
                        ${fullRow('البريد الإلكتروني', data.email)}
                        ${dualRow('سنة التخرج من المعهد التكنولوجي', data.techInstituteGradYear, 'سنة التخرج من الجامعة', data.universityGradYear)}

                        ${sectionRow('المسار المهني')}
                        ${fullRow('الشهادة / الدبلوم المحصل عليه', data.diploma)}
                        ${data.schoolEntryDate ? fullRow('تاريخ الدخول المدرسي الأولي', formatDate(data.schoolEntryDate)) : ''}
                        ${fullRow('تاريخ أول تعيين بالتعليم', formatDate(data.firstAppointmentDate))}
                        ${dualRow('الرتبة', data.job_rank, 'الصفة', data.status)}
                        ${triRow('السلم', data.echelon, 'الدرجة', data.grade, 'تاريخ التنفيذ', formatDate(data.executionDate))}
                        ${dualRow('تاريخ آخر تفتيش', formatDate(data.latestInspectionDate), 'علامته', data.latestInspectionScore)}
                        ${dualRow('تاريخ التفتيش ما قبل الأخير', formatDate(data.lastInspectionDate), 'علامته', data.lastInspectionScore)}

                        ${sectionRow('معلومات القسم')}
                        ${dualRow('القسم المُسند العام الماضي', data.previousYearClass, 'القسم المُسند هذا العام', data.currentYearClass)}
                        ${dualRow('عدد التلاميذ', data.studentCount, 'معني بالحركة', data.haraka)}
                        ${data.classNote ? fullRow('ملاحظة نصية للقسم', data.classNote) : ''}
                    </table>
                    ${timetableBlock}
                    ${buildSignatureBlock()}
                `
            );

            return createHiddenWrapper(html);
        }

        async function printRecord(record) {
            const btn = event && event.target ? event.target.closest('.btn-pdf') : null;
            setPdfButtonState(btn, true);

            let wrapper = null;
            try {
                const data = recordToData(record);
                wrapper = buildAdminPDFTemplate(data);
                const templateEl = wrapper.querySelector('#adminPdfTemplate');

                const namePart = [record.family_name, record.first_name].filter(Boolean).join('_');
                await exportTemplateToPdf(templateEl, `البطاقة_الشخصية${namePart ? '_' + namePart : ''}.pdf`);
            } catch (err) {
                console.error('PDF error:', err);
                showToast('حدث خطأ أثناء إنشاء PDF', 'error');
            } finally {
                if (wrapper) {
                    wrapper.remove();
                }
                setPdfButtonState(btn, false);
            }
        }

        function buildInspectionPDFTemplate(data) {
            const hasValue = value => value !== null && value !== undefined && String(value).trim() !== '';
            const isYesNoSection = items => items.every(item => {
                if (item.type === 'bool') return true;
                const choices = Array.isArray(item.choices) ? item.choices : [];
                if (!choices.length) return false;
                // Accept OUI/NON (2 options) and OUI/AH/NON (3 options) scales
                const codes = choices.map(ch => String(ch.code || '').toUpperCase());
                if (!codes.includes('OUI') && !codes.includes('NON')) return false;
                return choices.every(ch => String(ch.libelle || '').length <= 12);
            });

            const teacherName = [
                data.inspection.family_name,
                data.inspection.first_name,
                data.inspection.maiden_name ? `(${data.inspection.maiden_name})` : '',
            ].filter(Boolean).join(' ') || '—';

            const teacherTitle = data.inspection.gender === 'أنثى' ? 'الأستاذة' : 'الأستاذ';
            
            const ins = data.inspection;

            const getObservationValue = item => {
                if (!item || !item.response) return '';

                if (item.type_reponse === 'choix') {
                    const choice = (item.choices || []).find(ch => String(ch.id) === String(item.response.choice_id));
                    return choice ? (choice.libelle || '') : '';
                }
                if (item.type_reponse === 'texte') {
                    return item.response.valeur_texte || '';
                }
                if (item.type_reponse === 'bool') {
                    if (item.response.valeur_bool === null || item.response.valeur_bool === undefined || item.response.valeur_bool === '') {
                        return '';
                    }
                    return Number(item.response.valeur_bool) === 1 ? 'نعم' : 'لا';
                }
                if (item.type_reponse === 'note') {
                    return item.response.valeur_num !== null && item.response.valeur_num !== undefined && item.response.valeur_num !== ''
                        ? String(item.response.valeur_num)
                        : '';
                }
                return '';
            };

            const observationsHtml = (() => {
                const sections = Array.isArray(data.catalogue) ? data.catalogue : [];
                const sectionBlocks = sections.map(section => {
                    const items = Array.isArray(section.items) ? section.items : [];
                    const filled = items
                        .map(item => {
                            const value = getObservationValue(item);
                            const comment = item && item.response ? (item.response.commentaire || '') : '';
                            if (!hasValue(value) && !hasValue(comment)) return null;
                            return {
                                label: item.libelle || '',
                                value: value || '',
                                comment: comment || '',
                                type: item.type_reponse || '',
                                choices: item.choices || [],
                            };
                        })
                        .filter(Boolean);

                    if (!filled.length) return '';

                    const compactable = isYesNoSection(filled) && filled.every(row => !hasValue(row.comment));
                    const compactRow = compactable
                        ? `<div class="obs-inline">${filled.map(row => `<span><strong>${row.label}</strong>: ${row.value}</span>`).join('<span class="obs-sep">|</span>')}</div>`
                        : '';

                    const rows = compactable ? '' : filled.map(row => `
                        <div class="obs-item">
                            <div><span class="obs-item-label">${row.label}</span>: ${row.value}</div>
                            ${hasValue(row.comment) ? `<div class="obs-item-comment">ملاحظة: ${row.comment}</div>` : ''}
                        </div>
                    `).join('');

                    return `
                        <div class="obs-section">
                            <div class="obs-title">${section.titre || ''}</div>
                            ${compactRow}
                            ${rows}
                        </div>
                    `;
                });

                return sectionBlocks.filter(Boolean).length
                    ? sectionBlocks.filter(Boolean).join('')
                    : '<div class="obs-empty">لا توجد ملاحظات مسجلة لهذه الزيارة</div>';
            })();

            const visitRows = [];
            if (hasValue(ins.inspector_name)) visitRows.push(dualRow('اسم المفتش', ins.inspector_name, 'تاريخ الزيارة', formatDate(ins.inspection_date)));
            else if (hasValue(ins.inspection_date)) visitRows.push(dualRow('تاريخ الزيارة', formatDate(ins.inspection_date), '', ''));
            if (hasValue(ins.heure_visite) || hasValue(ins.duree_visite)) {
                visitRows.push(dualRow('ساعة الزيارة', hasValue(ins.heure_visite) ? ins.heure_visite : '—', 'مدة الزيارة', hasValue(ins.duree_visite) ? String(ins.duree_visite) : '—'));
            }
            if (hasValue(ins.school_name) || hasValue(ins.subject)) {
                visitRows.push(dualRow('المدرسة', hasValue(ins.school_name) ? ins.school_name : '—', 'المادة', hasValue(ins.subject) ? ins.subject : '—'));
            }

            const teacherRows = [];
            if (hasValue(teacherName) && teacherName !== '—') teacherRows.push(fullRow('الاسم الكامل', teacherName));
            if (hasValue(ins.job_rank) || hasValue(ins.teacher_status)) {
                teacherRows.push(dualRow('الرتبة', hasValue(ins.job_rank) ? ins.job_rank : '—', 'الصفة', hasValue(ins.teacher_status) ? ins.teacher_status : '—'));
            }
            if (hasValue(ins.echelon) || hasValue(ins.grade) || hasValue(ins.execution_date)) {
                teacherRows.push(triRow('السلم', hasValue(ins.echelon) ? ins.echelon : '—', 'الدرجة', hasValue(ins.grade) ? ins.grade : '—', 'تاريخ التنفيذ', hasValue(ins.execution_date) ? formatDate(ins.execution_date) : '—'));
            }
            if (hasValue(ins.current_year_class) || hasValue(ins.student_count)) {
                teacherRows.push(dualRow('القسم الحالي', hasValue(ins.current_year_class) ? ins.current_year_class : '—', 'عدد التلاميذ', hasValue(ins.student_count) ? String(ins.student_count) : '—'));
            }

            const evaluationsHtml = (() => {
                const evals = Array.isArray(data.evaluations) ? data.evaluations : [];
                if (!evals.length) return '';

                const cards = evals.map(ev => {
                    const sections = Array.isArray(ev.sections) ? ev.sections : [];
                    const sectionsHtml = sections.map(sec => {
                        const subsections = Array.isArray(sec.subsections) ? sec.subsections : [];
                        const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                        const subsHtml = subsections.map(sub => {
                            const items = Array.isArray(sub.items) ? sub.items : [];
                            const trimmedContenu = (sub.contenu || '').replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
                            return [
                                trimmedContenu ? `<div class="eval-sec-contenu" style="${sub.type==='texte'?'white-space:pre-wrap':''}">` + esc(trimmedContenu) + `</div>` : '',
                                ...items.map(it => `<div class="eval-sec-item">• ${esc(it)}</div>`),
                            ].join('');
                        }).join('');
                        const secContenu = (sec.contenu || '').replace(/^[\s\n\r]+|[\s\n\r]+$/g, '');
                        const isEmpty = !subsections.length && !secContenu && !subsHtml;
                        return [
                            `<div class="eval-sec-title">${esc(sec.titre)}</div>`,
                            secContenu ? `<div class="eval-sec-contenu">${esc(secContenu)}</div>` : '',
                            subsHtml,
                            isEmpty ? `<div class="eval-empty">—</div>` : '',
                        ].join('');
                    }).join('');

                    const scoreHtml = (ev.note_finale !== null && ev.note_finale !== undefined && String(ev.note_finale).trim() !== '')
                        ? `<span class="eval-card-score">العلامة: ${ev.note_finale} / 20</span>`
                        : '';

                    return `
                        <div class="eval-card">
                            <div class="eval-card-header">
                                <strong>${ev.titre || ''}</strong>
                                ${scoreHtml}
                            </div>
                            ${sectionsHtml || `<div class="eval-empty">لا توجد أقسام مسجلة.</div>`}
                        </div>`;
                }).join('');

                return `
                    <div class="eval-wrap">
                        <div class="pdf-section">التقييمات</div>
                        ${cards}
                    </div>`;
            })();

            const html = wrapPdfPage(
                'inspPdfTemplate',
                PDF_INSPECTION_EXTRA_CSS,
                `
                    ${buildHeaderBlock('تقرير زيارة التفتيش', 'بيانات الزيارة الميدانية')}
                    <div class="pdf-name-box">
                        ${hasValue(ins.school_name) ? `<div>مدرسة : ${ins.school_name}</div>` : ''}
                        ${teacherName !== '—' ? `<div>${teacherTitle} : ${teacherName}</div>` : ''}
                    </div>
                    <table class="pdf-tbl">
                        ${visitRows.length ? `${sectionRow('معلومات الزيارة')}${visitRows.join('')}` : ''}
                        ${teacherRows.length ? `${sectionRow('معلومات الأستاذ / الأستاذة')}${teacherRows.join('')}` : ''}
                      
                    </table>
                    <div class="obs-wrap">
                        <div class="pdf-section">الملاحظات المرتبطة بالتفتيش</div>
                        ${observationsHtml}
                    </div>
                    ${evaluationsHtml}
                    ${buildSignatureBlock()}
                `
            );

            return createHiddenWrapper(html);
        }

        async function printInspection(btn, inspId, inspName) {
            setPdfButtonState(btn, true);

            let wrapper = null;
            try {
                const res = await fetch('api/admin/inspection_report.php?id=' + encodeURIComponent(inspId), { credentials: 'same-origin' });
                const data = await res.json();
                if (!data.success) {
                    showToast(data.message || 'فشل تحميل بيانات التفتيش', 'error');
                    return;
                }

                wrapper = buildInspectionPDFTemplate(data);
                const templateEl = wrapper.querySelector('#inspPdfTemplate');
                await exportTemplateToPdf(
                    templateEl,
                    `تقرير_التفتيش${inspName ? '_' + inspName : ''}.pdf`,
                    {
                        breakSelectors: ['.pdf-header', '.pdf-name-box', '.pdf-tbl tr', '.obs-title', '.obs-item', '.obs-inline', '.eval-card', '.eval-sec-title', '.pdf-signoff'],
                        avoidOrphanSelectors: ['.pdf-signoff'],
                    }
                );
            } catch (err) {
                console.error('Inspection PDF error:', err);
                showToast('حدث خطأ أثناء إنشاء PDF', 'error');
            } finally {
                if (wrapper) {
                    wrapper.remove();
                }
                setPdfButtonState(btn, false);
            }
        }

        return {
            printRecord,
            printInspection,
        };
    };
})();
