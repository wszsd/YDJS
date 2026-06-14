(function() {
    'use strict';

    // 创建按钮元素
    const button = document.createElement('button');
    button.textContent = '跳转百度';
    
    // 设置按钮样式 - 右上角定位
    button.style.position = 'fixed';
    button.style.top = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    
    // 美观的样式设计
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#1890ff';
    button.style.color = '#ffffff';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.fontSize = '14px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    button.style.transition = 'all 0.3s ease';
    
    // 添加悬停效果
    button.onmouseenter = function() {
        button.style.backgroundColor = '#40a9ff';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        button.style.transform = 'translateY(-1px)';
    };
    
    button.onmouseleave = function() {
        button.style.backgroundColor = '#1890ff';
        button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        button.style.transform = 'translateY(0)';
    };
    
    // 点击事件 - 跳转到百度
    button.onclick = function() {
        window.open('https://www.baidu.com', '_blank');
    };
    
    // 将按钮添加到页面
    document.body.appendChild(button);
})();
