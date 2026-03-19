(function () {
    'use strict';

    window.createAdminImportModule = function createAdminImportModule(deps) {
        const { showToast, esc, loadRecords } = deps;

        const importModal = document.getElementById('importModal');
        const importFileInput = document.getElementById('importFileInput');
        const importDropZone = document.getElementById('importDropZone');
        const importPreviewWrap = document.getElementById('importPreviewWrap');
        const importPreviewTbl = document.getElementById('importPreviewTbl');
        const importStartBtn = document.getElementById('importStartBtn');
        const importStatusBar = document.getElementById('importStatusBar');
        const importRowCount = document.getElementById('importRowCount');

        let parsedRows = [];

        function openImportModal() {
            resetImportModal();
            importModal.classList.remove('hidden');
        }

        function closeImportModal() {
            importModal.classList.add('hidden');
        }

        function resetImportModal() {
            parsedRows = [];
            importFileInput.value = '';
            importPreviewWrap.style.display = 'none';
            importStartBtn.disabled = true;
            importStatusBar.className = 'import-status-bar';
            importStatusBar.innerHTML = '';
            importRowCount.textContent = '';
        }

        document.getElementById('openImportBtn').addEventListener('click', openImportModal);
        document.getElementById('importModalClose').addEventListener('click', closeImportModal);
        document.getElementById('importCancelBtn').addEventListener('click', closeImportModal);
        importModal.addEventListener('click', e => {
            if (e.target === importModal) {
                closeImportModal();
            }
        });

        importDropZone.addEventListener('dragover', e => {
            e.preventDefault();
            importDropZone.classList.add('drag-over');
        });
        importDropZone.addEventListener('dragleave', () => importDropZone.classList.remove('drag-over'));
        importDropZone.addEventListener('drop', e => {
            e.preventDefault();
            importDropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                processFile(file);
            }
        });
        importDropZone.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', e => {
            const f = e.target.files[0];
            if (f) {
                processFile(f);
            }
        });

        function processFile(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['xlsx', 'xls', 'csv'].includes(ext)) {
                showStatus('error', 'يُرجى اختيار ملف xlsx أو csv فقط');
                return;
            }
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: false });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    if (rows.length < 2) {
                        showStatus('error', 'الملف فارغ أو لا يحتوي على بيانات');
                        return;
                    }
                    const headerRow = rows[0].map(h => String(h).trim());
                    parsedRows = [];
                    for (let r = 1; r < rows.length; r++) {
                        const cells = rows[r];
                        if (cells.every(c => c === '' || c === null || c === undefined)) {
                            continue;
                        }
                        const obj = {};
                        headerRow.forEach((h, i) => {
                            obj[h] = cells[i] !== undefined ? String(cells[i]).trim() : '';
                        });
                        parsedRows.push(obj);
                    }
                    if (parsedRows.length === 0) {
                        showStatus('error', 'لا توجد صفوف بيانات صالحة');
                        return;
                    }
                    renderPreview(headerRow, parsedRows);
                    importRowCount.textContent = 'تم تحميل ' + parsedRows.length + ' سجل(ات)';
                    importStartBtn.disabled = false;
                    showStatus('info', 'راجع البيانات أدناه ثم اضغط «استيراد» لإضافتها إلى قاعدة البيانات.');
                } catch (err) {
                    showStatus('error', 'تعذّر قراءة الملف: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function renderPreview(headers, rows) {
            const maxCols = Math.min(headers.length, 8);
            let html = '<thead><tr><th>#</th>';
            headers.slice(0, maxCols).forEach(h => {
                html += '<th>' + esc(h) + '</th>';
            });
            if (headers.length > maxCols) {
                html += '<th>…</th>';
            }
            html += '</tr></thead><tbody>';
            const maxPrev = Math.min(rows.length, 10);
            for (let i = 0; i < maxPrev; i++) {
                html += '<tr><td>' + (i + 1) + '</td>';
                headers.slice(0, maxCols).forEach(h => {
                    html += '<td>' + esc(rows[i][h] ?? '') + '</td>';
                });
                if (headers.length > maxCols) {
                    html += '<td>…</td>';
                }
                html += '</tr>';
            }
            if (rows.length > maxPrev) {
                html += '<tr><td colspan="' + (maxCols + 2) + '" class="preview-more-row">… و' + (rows.length - maxPrev) + ' سجلات أخرى</td></tr>';
            }
            html += '</tbody>';
            importPreviewTbl.innerHTML = html;
            importPreviewWrap.style.display = 'block';
        }

        function showStatus(type, msg, extra) {
            importStatusBar.className = 'import-status-bar ' + type;
            importStatusBar.innerHTML = msg;
            if (extra && extra.length) {
                let ul = '<ul class="import-errors-list">';
                extra.forEach(e => {
                    const tag = e.type === 'duplicate' ? ' (تكرار)' : '';
                    ul += '<li>صف ' + e.row + (e.name ? ' – ' + esc(e.name) : '') + ': ' + esc(e.msg) + tag + '</li>';
                });
                ul += '</ul>';
                importStatusBar.innerHTML += ul;
            }
        }

        importStartBtn.addEventListener('click', async () => {
            if (!parsedRows.length) {
                return;
            }
            importStartBtn.disabled = true;
            importStartBtn.textContent = 'جارٍ الاستيراد…';
            showStatus('info', 'جارٍ إرسال البيانات…');
            try {
                const res = await fetch('api/admin/import_records.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records: parsedRows }),
                });
                const data = await res.json();
                if (data.success) {
                    const parts = [];
                    if (data.inserted > 0) {
                        parts.push('✅ تم إضافة <strong>' + data.inserted + '</strong> بطاقة بنجاح');
                    }
                    if (data.skipped > 0) {
                        parts.push('⚠️ تم تجاهل <strong>' + data.skipped + '</strong> تكرار (بريد مستخدم)');
                    }
                    const errCount = (data.errors || []).filter(e => e.type !== 'duplicate').length;
                    if (errCount > 0) {
                        parts.push('❌ <strong>' + errCount + '</strong> سجل غير صالح');
                    }
                    const type = errCount === 0 && data.skipped === 0 ? 'success' : 'info';
                    showStatus(type, parts.join(' &nbsp;|&nbsp; '), data.errors || []);
                    if (data.inserted > 0) {
                        showToast('تم استيراد ' + data.inserted + ' بطاقة');
                        await loadRecords();
                    }
                } else {
                    showStatus('error', data.message || 'فشل الاستيراد');
                }
            } catch (err) {
                showStatus('error', 'خطأ في الاتصال: ' + err.message);
            } finally {
                importStartBtn.disabled = false;
                importStartBtn.textContent = 'استيراد';
            }
        });

        return {
            openImportModal,
        };
    };
})();
