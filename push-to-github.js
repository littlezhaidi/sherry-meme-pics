const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

async function pushToGitHub() {
    try {
        const dir = process.cwd();
        
        console.log('正在初始化 Git 操作...');
        
        // 设置作者信息
        await git.setConfig({
            fs,
            dir,
            path: 'user.name',
            value: 'liangcka'
        });
        
        await git.setConfig({
            fs,
            dir,
            path: 'user.email',
            value: 'liangkga@qq.com'
        });
        
        console.log('作者信息已设置');
        
        // 检查当前状态
        const status = await git.statusMatrix({
            fs,
            dir,
            filter: () => true
        });
        
        console.log('文件状态检查完成');
        
        // 添加所有文件到暂存区
        for (const [filepath] of status) {
            await git.add({
                fs,
                dir,
                filepath
            });
        }
        
        console.log('所有文件已添加到暂存区');
        
        // 创建提交
        const commitHash = await git.commit({
            fs,
            dir,
            author: {
                name: 'liangcka',
                email: 'liangkga@qq.com'
            },
            message: 'Initial commit with project files'
        });
        
        console.log('提交创建成功:', commitHash);
        
        // 推送到远程仓库
        console.log('正在推送到 GitHub...');
        
        const pushResult = await git.push({
            fs,
            http,
            dir,
            remote: 'origin',
            ref: 'main',
            onAuth: () => {
                // 这里需要提供认证信息
                console.log('需要 GitHub 认证信息');
                console.log('请提供 Personal Access Token 或用户名密码');
                return {
                    username: 'your-username', // 需要替换为实际的用户名
                    password: 'your-token-or-password' // 需要替换为 token 或密码
                };
            }
        });
        
        console.log('✅ 推送成功!');
        console.log('推送结果:', pushResult);
        
    } catch (error) {
        console.error('❌ 推送过程中出现错误:', error);
        
        if (error.code === 'HttpError' || error.message.includes('Authentication')) {
            console.log('\n💡 GitHub 认证指南:');
            console.log('1. 使用 Personal Access Token (推荐):');
            console.log('   - 访问 https://github.com/settings/tokens');
            console.log('   - 点击 "Generate new token"');
            console.log('   - 选择 "repo" 权限');
            console.log('   - 生成 token 并复制');
            console.log('   - 在脚本中替换 username 和 password');
            console.log('2. 或者使用用户名和密码（如果启用了双重验证则不推荐）');
        }
    }
}

// 执行推送
pushToGitHub();