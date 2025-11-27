document.addEventListener('DOMContentLoaded', () => {
    const bgSelect = document.getElementById('bg-select');
    const bgPreview = document.getElementById('bg-preview');
    const fontSelect = document.getElementById('font-select');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');
    const downloadLinkContainer = document.getElementById('download-link-container');
    const downloadLink = document.getElementById('download-link');

    // Load available backgrounds
    fetch('/api/backgrounds')
        .then(res => res.json())
        .then(files => {
            if (files.length === 0) {
                const option = document.createElement('option');
                option.text = "没有找到背景图片";
                bgSelect.add(option);
                bgSelect.disabled = true;
                return;
            }
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.text = file;
                bgSelect.add(option);
            });
            // Select first one and update preview
            if (files.length > 0) {
                bgSelect.selectedIndex = 0;
                updateBgPreview(files[0]);
            }
        });

    // Load available fonts
    fetch('/api/fonts')
        .then(res => res.json())
        .then(files => {
            if (files.length === 0) {
                const option = document.createElement('option');
                option.text = "默认字体";
                option.value = "";
                fontSelect.add(option);
                return;
            }
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.text = file;
                fontSelect.add(option);
            });
        });

    // Update background preview when selection changes
    bgSelect.addEventListener('change', (e) => {
        updateBgPreview(e.target.value);
    });

    function updateBgPreview(filename) {
        bgPreview.src = `/background_images/${filename}`;
    }

    // Generate image
    generateBtn.addEventListener('click', () => {
        const text = document.getElementById('text-input').value;
        const bgImage = bgSelect.value;
        const fontFile = fontSelect.value;
        const fontSize = document.getElementById('font-size').value;
        const textColor = document.getElementById('text-color').value;
        const useOutline = document.getElementById('use-outline').checked;
        const outlineWidth = document.getElementById('outline-width').value;
        const useBold = document.getElementById('use-bold').checked;

        if (!text) {
            alert("请输入文字！");
            return;
        }

        loadingDiv.classList.remove('hidden');
        resultImage.classList.add('hidden');
        downloadLinkContainer.classList.add('hidden');

        fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                bgImage,
                fontFile,
                fontSize,
                textColor,
                useOutline,
                outlineWidth,
                useBold
            })
        })
        .then(res => res.json())
        .then(data => {
            loadingDiv.classList.add('hidden');
            if (data.success) {
                resultImage.src = data.imageUrl;
                resultImage.classList.remove('hidden');
                
                downloadLink.href = data.imageUrl;
                downloadLink.download = data.filename;
                downloadLinkContainer.classList.remove('hidden');
            } else {
                alert("生成失败: " + data.error);
            }
        })
        .catch(err => {
            loadingDiv.classList.add('hidden');
            console.error(err);
            alert("请求出错，请查看控制台");
        });
    });
});
