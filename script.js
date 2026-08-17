const API_ENDPOINT_WITH_SIGNATURE = 'https://vdownload.2tech.top/vdownload/parse/parseUrlWithSignature';
const SECRET_KEY = 'vdownload_secret_key_2024';

// 批量下载图片功能
async function batchDownloadImages(imageUrls, title) {
    const batchBtn = document.getElementById('batch-download-btn');
    const originalText = batchBtn.textContent;
    
    try {
        batchBtn.disabled = true;
        batchBtn.textContent = '正在下载...';
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                batchBtn.textContent = `正在下载... (${i + 1}/${imageUrls.length})`;
                
                const response = await fetch(imageUrls[i]);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                const extension = blob.type.split('/')[1] || 'jpg';
                const fileName = `${title || '图片'}_${i + 1}.${extension}`;
                link.download = fileName;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`下载第${i + 1}张图片失败:`, error);
                failCount++;
            }
        }
        
        if (failCount === 0) {
            batchBtn.textContent = `下载完成! (${successCount}张)`;
            batchBtn.style.backgroundColor = '#4CAF50';
        } else {
            batchBtn.textContent = `下载完成! 成功:${successCount}张, 失败:${failCount}张`;
            batchBtn.style.backgroundColor = '#FF9800';
        }
        
        setTimeout(() => {
            batchBtn.disabled = false;
            batchBtn.textContent = originalText;
            batchBtn.style.backgroundColor = '';
        }, 3000);
        
    } catch (error) {
        console.error('批量下载失败:', error);
        batchBtn.textContent = '下载失败，请重试';
        batchBtn.style.backgroundColor = '#f44336';
        batchBtn.disabled = false;
        
        setTimeout(() => {
            batchBtn.textContent = originalText;
            batchBtn.style.backgroundColor = '';
        }, 3000);
    }
}

// 检测平台类型
function detectPlatform(url) {
    if (url.includes('douyin.com') || url.includes('iesdouyin.com')) return 'douyin';
    if (url.includes('kuaishou.com')) return 'kuaishou';
    if (url.includes('xiaohongshu.com') || url.includes('xhslink.com')) return 'xiaohongshu';
    if (url.includes('bilibili.com')) return 'bilibili';
    if (url.includes('weibo.com')) return 'weibo';
    if (url.includes('pipix.com')) return 'pipix';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'unknown';
}

const input = document.getElementById('input-url');
const btn = document.getElementById('btn-parse');
const result = document.getElementById('result');
const errorBox = document.getElementById('error');
const loading = document.getElementById('loading');

function setLoading(state) {
    loading.style.display = state ? 'block' : 'none';
    btn.disabled = state;
}

function showError(msg) {
    errorBox.style.display = 'block';
    errorBox.textContent = msg;
}

function clearError() {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
}

/**
 * 生成MD5签名
 * @param {string} str 待签名字符串
 * @returns {string} MD5签名
 */
function md5(str) {
    // 简单的MD5实现
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX, lY) {
        const lX4 = (lX & 0x40000000);
        const lY4 = (lY & 0x40000000);
        const lX8 = (lX & 0x80000000);
        const lY8 = (lY & 0x80000000);
        const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }

    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(str) {
        let lWordCount;
        const lMessageLength = str.length;
        const lNumberOfWords_temp1 = lMessageLength + 8;
        const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        const lWordArray = new Array(lNumberOfWords - 1);
        let lBytePosition = 0;
        let lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function wordToHex(lValue) {
        let wordToHexValue = "";
        let wordToHexValue_temp = "";
        let lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }

    function utf8Encode(str) {
        str = str.replace(/\r\n/g, "\n");
        let utftext = "";
        for (let n = 0; n < str.length; n++) {
            const c = str.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    let x = convertToWordArray(utf8Encode(str));
    let a = 0x67452301;
    let b = 0xEFCDAB89;
    let c = 0x98BADCFE;
    let d = 0x10325476;

    for (let k = 0; k < x.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], 23, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }

    const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    return temp.toLowerCase();
}

/**
 * 生成签名
 * @param {string} url 请求的URL
 * @param {number} timestamp 时间戳
 * @returns {string} 签名字符串
 */
function generateSignature(url, timestamp) {
    const signStr = `url=${url}&timestamp=${timestamp}&key=${SECRET_KEY}`;
    return md5(signStr);
}

function renderResultFromBackend(payload) {
    if (!payload || typeof payload !== 'object') {
        result.innerHTML = '<div class="hint">响应为空</div>';
        return;
    }
    const { erroCode, erroMsg, result: data } = payload;
    if (erroCode !== 2000 || !data) {
        result.innerHTML = `<div class="error">${erroMsg || '解析失败'}</div>`;
        return;
    }

    const title = data.title || '';
    const cover = data.image || '';
    const videoUrl = data.video || '';
    const atlas = Array.isArray(data.atlas) ? data.atlas : [];

    if (videoUrl) {
        result.innerHTML = `
            <div>
                <div style="margin:8px 0">${title}</div>
                <div class="item">
                    <video controls src="${videoUrl}" ${cover ? `poster="${cover}"` : ''}></video>
                    <a class="dl" href="${videoUrl}" target="_blank" download>下载视频</a>
                </div>
            </div>
        `;
        return;
    }

    if (atlas.length > 0) {
        const imgs = atlas.map((u, idx) => `
            <div class="item">
                <img src="${u}" />
                <a class="dl" href="${u}" target="_blank" download>下载第${idx + 1}张</a>
            </div>
        `).join('');
        result.innerHTML = `
            <div>
                <div style="margin:8px 0">${title}</div>
                <div style="margin:8px 0">
                    <button id="batch-download-btn" class="batch-download-btn">批量下载全部图片 (${atlas.length}张)</button>
                </div>
                <div class="grid">${imgs}</div>
            </div>
        `;
        
        const batchBtn = document.getElementById('batch-download-btn');
        batchBtn.addEventListener('click', () => batchDownloadImages(atlas, title));
        return;
    }

    result.innerHTML = '<div class="hint">未解析到视频或图集</div>';
}

btn.addEventListener('click', async () => {
    clearError();
    result.innerHTML = '';
    const url = (input.value || '').trim();
    
    if (!url) {
        showError('请输入分享链接');
        return;
    }

    const endpoint = API_ENDPOINT_WITH_SIGNATURE;

    if (!endpoint) {
        showError('未配置后端接口地址');
        return;
    }

    setLoading(true);
    try {
        let headers = {
            'Content-Type': 'application/json'
        };

        const timestamp = Date.now();
        const signature = generateSignature(url, timestamp);
        headers['timestamp'] = timestamp.toString();
        headers['signature'] = signature;

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ url })
        });
        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data?.erroMsg || `请求失败(${resp.status})`);
        }
        renderResultFromBackend(data);
    } catch (e) {
        showError(e.message || '解析失败');
    } finally {
        setLoading(false);
    }
});
