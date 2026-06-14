(function() {
    'use strict';

    // ---------- 默认配置 ----------
    const DEFAULT_CONFIG = {
        projectCode: '',
        taskCodes: '',
        coopcompanyCode: '',
        coopcompanyName: '',
        scanPersonName: '',
        scanPersonId: '',
        concurrent: 100,
        roleCodes: ['ALL_JLGCS', 'MCEG_ALL_TJJLDWZFZR', 'MCEG_ALL_TJJLGCS']
    };

    const STORAGE_KEY = 'pms_install_config';
    const TARGET_URL_PATTERN = '/queryList/XZAZ';

    // 存储捕获到的token
    let capturedToken = null;
    let uiShown = false;

    // 统计变量
    let totalTasks = 0;
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // 日志容器
    let logContainer;

    // ---------- 本地存储操作 ----------
    function loadConfigFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('读取本地配置失败', e);
        }
        return {};
    }

    function saveConfigToStorage() {
        try {
            const config = {
                projectCode: document.getElementById('cpms-input-projectCode')?.value || '',
                taskCodes: document.getElementById('cpms-input-taskCodes')?.value || '',
                coopcompanyCode: document.getElementById('cpms-input-coopcompanyCode')?.value || '',
                coopcompanyName: document.getElementById('cpms-input-coopcompanyName')?.value || '',
                scanPersonName: document.getElementById('cpms-input-scanPersonName')?.value || '',
                scanPersonId: document.getElementById('cpms-input-scanPersonId')?.value || '',
                concurrent: document.getElementById('cpms-input-concurrent')?.value || DEFAULT_CONFIG.concurrent.toString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('保存本地配置失败', e);
        }
    }

    // ---------- 日志函数 ----------
    function log(message, type = 'info') {
        if (!logContainer) return;
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.style.margin = '2px 0';
        entry.style.fontFamily = 'monospace';
        entry.style.fontSize = '12px';
        entry.style.color = type === 'error' ? 'red' : (type === 'success' ? 'green' : (type === 'warn' ? 'orange' : '#333'));
        entry.textContent = `[${time}] ${message}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // ---------- 重置统计 ----------
    function resetStats() {
        totalTasks = 0;
        successCount = 0;
        failCount = 0;
        skipCount = 0;
    }

    // ---------- 拦截 XMLHttpRequest 以捕获 token ----------
    function installXHRInterceptor() {
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._requestUrl = url;
            return originalXHROpen.apply(this, [method, url, ...rest]);
        };

        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'authorization') {
                this._authHeader = value;
            }
            return originalXHRSetRequestHeader.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            const url = this._requestUrl;
            if (url && url.includes(TARGET_URL_PATTERN) && this._authHeader) {
                capturedToken = this._authHeader;
                log('捕获到Token（XHR）');
                showUI();
            }
            return originalXHRSend.apply(this, args);
        };
    }

    // ---------- 显示UI（折叠按钮）----------
    function showUI() {
        if (uiShown) return;
        uiShown = true;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createCollapsedButton);
        } else {
            createCollapsedButton();
        }
    }

    // ---------- 创建折叠按钮和面板 ----------
    let collapsedBtn, expandedPanel;

    function createCollapsedButton() {
        collapsedBtn = document.createElement('button');
        collapsedBtn.id = 'cpms-collapsed-btn';
        collapsedBtn.innerText = '展开插件';
        collapsedBtn.style.position = 'fixed';
        collapsedBtn.style.top = '110px';
        collapsedBtn.style.right = '20px';
        collapsedBtn.style.zIndex = '9999';
        collapsedBtn.style.padding = '5px 5px';
        collapsedBtn.style.backgroundColor = '#2196F3';
        collapsedBtn.style.color = 'white';
        collapsedBtn.style.border = 'none';
        collapsedBtn.style.borderRadius = '5px';
        collapsedBtn.style.cursor = 'pointer';
        collapsedBtn.style.fontSize = '15px';
        collapsedBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        collapsedBtn.onclick = expandPanel;
        document.body.appendChild(collapsedBtn);
    }

    function expandPanel() {
        if (collapsedBtn) collapsedBtn.style.display = 'none';
        if (!expandedPanel) {
            expandedPanel = createExpandedPanel();
            document.body.appendChild(expandedPanel);
        } else {
            expandedPanel.style.display = 'block';
        }
    }

    function collapsePanel() {
        if (expandedPanel) expandedPanel.style.display = 'none';
        if (collapsedBtn) collapsedBtn.style.display = 'block';
    }

    function createExpandedPanel() {
        const panel = document.createElement('div');
        panel.id = 'cpms-expanded-panel';
        panel.style.position = 'fixed';
        panel.style.top = '110px';
        panel.style.right = '20px';
        panel.style.zIndex = '10000';
        panel.style.width = '400px';
        panel.style.backgroundColor = '#fff';
        panel.style.border = '1px solid #ccc';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        panel.style.padding = '15px';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.fontSize = '14px';

        // 标题栏
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.style.borderBottom = '1px solid #eee';
        header.style.paddingBottom = '5px';

        const title = document.createElement('span');
        title.innerText = '安装单信息配置';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';

        const shrinkBtn = document.createElement('button');
        shrinkBtn.innerText = '-';
        shrinkBtn.style.padding = '2px 10px';
        shrinkBtn.style.cursor = 'pointer';
        shrinkBtn.style.backgroundColor = '#f0f0f0';
        shrinkBtn.style.border = '1px solid #aaa';
        shrinkBtn.style.borderRadius = '3px';
        shrinkBtn.onclick = collapsePanel;

        header.appendChild(title);
        header.appendChild(shrinkBtn);
        panel.appendChild(header);

        // 从本地存储加载已保存的配置
        const savedConfig = loadConfigFromStorage();

        // 输入区域定义
        const inputs = [
            { label: '项目编码', id: 'projectCode', value: savedConfig.projectCode !== undefined ? savedConfig.projectCode : DEFAULT_CONFIG.projectCode },
            { label: '任务编码', id: 'taskCodes', value: savedConfig.taskCodes !== undefined ? savedConfig.taskCodes : DEFAULT_CONFIG.taskCodes },
            { label: '公司代码', id: 'coopcompanyCode', value: savedConfig.coopcompanyCode !== undefined ? savedConfig.coopcompanyCode : DEFAULT_CONFIG.coopcompanyCode },
            { label: '公司名称', id: 'coopcompanyName', value: savedConfig.coopcompanyName !== undefined ? savedConfig.coopcompanyName : DEFAULT_CONFIG.coopcompanyName },
            { label: '人员名字', id: 'scanPersonName', value: savedConfig.scanPersonName !== undefined ? savedConfig.scanPersonName : DEFAULT_CONFIG.scanPersonName },
            { label: '人员ID', id: 'scanPersonId', value: savedConfig.scanPersonId !== undefined ? savedConfig.scanPersonId : DEFAULT_CONFIG.scanPersonId },
            { label: '并发数量', id: 'concurrent', value: savedConfig.concurrent !== undefined ? savedConfig.concurrent : DEFAULT_CONFIG.concurrent.toString(), type: 'number' }
        ];

        // 创建输入框并添加保存事件
        inputs.forEach(item => {
            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';

            const label = document.createElement('label');
            label.innerText = item.label + ':';
            label.style.width = '100px';
            label.style.flexShrink = '0';

            const input = document.createElement('input');
            input.type = item.type || 'text';
            input.id = `cpms-input-${item.id}`;
            input.value = item.value;
            input.style.flex = '1';
            input.style.padding = '4px';
            input.style.border = '1px solid #ccc';
            input.style.borderRadius = '3px';

            // 输入变化时自动保存到本地
            input.addEventListener('input', saveConfigToStorage);

            row.appendChild(label);
            row.appendChild(input);
            panel.appendChild(row);
        });

        // 开始运行按钮
        const runBtn = document.createElement('button');
        runBtn.id = 'cpms-run-btn';
        runBtn.innerText = '开始运行';
        runBtn.style.width = '100%';
        runBtn.style.padding = '8px';
        runBtn.style.marginTop = '10px';
        runBtn.style.backgroundColor = '#4CAF50';
        runBtn.style.color = 'white';
        runBtn.style.border = 'none';
        runBtn.style.borderRadius = '4px';
        runBtn.style.cursor = 'pointer';
        runBtn.style.fontSize = '16px';
        runBtn.onclick = startProcess;
        panel.appendChild(runBtn);

        const rizhiwenzi = document.createElement('div');
        rizhiwenzi.innerText = '运行日志';
        rizhiwenzi.style.marginTop = '10px';
        rizhiwenzi.style.fontWeight = 'bold';
        panel.appendChild(rizhiwenzi);

        // 日志展示框
        logContainer = document.createElement('div');
        logContainer.id = 'cpms-log';
        logContainer.style.marginTop = '15px';
        logContainer.style.border = '1px solid #ccc';
        logContainer.style.borderRadius = '4px';
        logContainer.style.padding = '8px';
        logContainer.style.height = '200px';
        logContainer.style.overflowY = 'auto';
        logContainer.style.backgroundColor = '#f9f9f9';
        logContainer.style.fontFamily = 'monospace';
        logContainer.style.fontSize = '12px';
        logContainer.style.whiteSpace = 'pre-wrap';
        logContainer.style.wordBreak = 'break-all';
        panel.appendChild(logContainer);

        return panel;
    }

    // ---------- 获取Token ----------
    function getToken() {
        if (!capturedToken) {
            throw new Error('尚未捕获到有效的Authorization Token，请确保已触发XZAZ请求');
        }
        return capturedToken;
    }

    // ---------- 通用请求头 ----------
    function getHeaders() {
        return {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json;charset=UTF-8',
            'authorization': getToken(),
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'isajax': 'true'
        };
    }

    // 随机生成 x-blueware-id
    function generateBluewareId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // ---------- 单个任务处理流程 ----------
    async function processSingleTask(taskCode, config) {
        const { projectCode, coopcompanyCode, coopcompanyName, scanPersonName, scanPersonId, roleCodes } = config;

        log(`▶️ 开始处理任务: ${taskCode}`);

        // 1. 查询任务信息
        let taskInfo;
        try {
            taskInfo = await queryTask(projectCode, taskCode);
            if (!taskInfo) {
                log(`❌ 任务 ${taskCode} 查询失败，跳过`, 'error');
                failCount++;
                return;
            }
        } catch (e) {
            log(`❌ 任务 ${taskCode} 查询异常: ${e.message}`, 'error');
            failCount++;
            return;
        }

        // 2. 获取物料明细（含可装量全0检测）
        let materialList;
        try {
            materialList = await getMaterialDetail(projectCode, taskCode, coopcompanyCode);
            if (materialList === null) {
                // 全0情况已记录日志，计入跳过
                skipCount++;
                return;
            }
        } catch (e) {
            log(`❌ 任务 ${taskCode} 获取物料异常: ${e.message}`, 'error');
            failCount++;
            return;
        }

        // 3. 获取相关人员列表
        let personUid;
        try {
            personUid = await getPersonsList(taskInfo.taskId, projectCode, roleCodes, taskCode);
            if (!personUid) {
                log(`❌ 任务 ${taskCode} 未找到相关人员，跳过`, 'error');
                failCount++;
                return;
            }
        } catch (e) {
            log(`❌ 任务 ${taskCode} 获取人员异常: ${e.message}`, 'error');
            failCount++;
            return;
        }

        // 4. 获取人员组织树详情
        let userDetail;
        try {
            userDetail = await getOrgUserTree(personUid, taskCode);
            if (!userDetail) {
                log(`❌ 任务 ${taskCode} 获取组织树失败，跳过`, 'error');
                failCount++;
                return;
            }
        } catch (e) {
            log(`❌ 任务 ${taskCode} 获取组织树异常: ${e.message}`, 'error');
            failCount++;
            return;
        }

        // 5. 提交安装单
        try {
            await submitInstallOrder(taskInfo, materialList, userDetail, coopcompanyCode, coopcompanyName, scanPersonName, scanPersonId, taskCode);
            log(`✅ 任务 ${taskCode} 提交成功`, 'success');
            successCount++;
        } catch (e) {
            log(`❌ 任务 ${taskCode} 提交异常: ${e.message}`, 'error');
            failCount++;
        }
    }

    // ---------- 以下为各接口的具体实现 ----------
    async function queryTask(projectCode, taskCode) {
        const url = 'https://cpms.it.chinamobile.com/cpms/mmat/v1/queryList/Task';
        const body = {
            page: 1,
            size: 50,
            type: 'XZAZ',
            functionType: 1,
            projectCodes: [projectCode],
            taskCodeLike: taskCode
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.code !== '000000' || !data.body.list || data.body.list.length === 0) {
            log(`查询任务返回为空: ${taskCode}`, 'warn');
            return null;
        }

        const task = data.body.list[0];
        log(`查询到任务: ${task.taskCode} (${task.taskName})`);
        return {
            taskId: task.taskId,
            taskCode: task.taskCode,
            taskName: task.taskName,
            projectCode: task.projectCode,
            projectName: task.projectName
        };
    }

    async function getMaterialDetail(projectCode, taskCode, coopcompanyCode) {
        const url = 'https://cpms.it.chinamobile.com/cpms/mmat/v1/installorderLine/taskReceiptDetail';
        const body = {
            projectCode: projectCode,
            taskCode: taskCode,
            coopcompanyCode: coopcompanyCode,
            install: 1
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.code !== '000000') {
            log(`获取物料明细失败: ${data.message}`, 'error');
            return null;
        }

        const materials = data.body.aSupplyDtos || data.body.asupplyDtos;
        if (!materials || materials.length === 0) {
            log(`物料列表为空`, 'warn');
            return null;
        }

        // 检测所有物料的canInstallAmount是否全为0
        const allZero = materials.every(item => item.canInstallAmount == 0);
        if (allZero) {
            log(`⚠️ 任务 ${taskCode} 可安装数量为0，跳过后续操作`, 'warn');
            return null;
        }

        log(`任务 ${taskCode} 获取到物料 ${materials.length} 条，可安装数量正常`);
        return materials;
    }

    async function getPersonsList(taskId, projectCode, roleCodes, taskCode) {
        const url = 'https://cpms.it.chinamobile.com/cpms/mmat/v1/allPublicBusiness/personsList';
        const body = {
            billType: 'XZAZ',
            taskIds: [taskId],
            projectCode: projectCode,
            roleCodes: roleCodes
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.code !== '000000' || !data.body || data.body.length === 0) {
            log(`未找到相关人员`, 'warn');
            return null;
        }

        const person = data.body[0];
        log(`任务 ${taskCode} 获取到人员: ${person.coopcompanyPersonName} (${person.uid})`);
        return person.uid;
    }

    async function getOrgUserTree(uid, taskCode) {
        const url = 'https://cpms.it.chinamobile.com/cpms/component/components/getOrgUserTree';
        const body = {
            version: '3.0',
            filterIds: [uid],
            orgTreeRequestDtoList: [],
            activityDefRuleList: [],
            isEncryptStr: false
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.code !== '000000' || !data.body || data.body.length === 0) {
            log(`获取组织树失败`, 'error');
            return null;
        }

        const org = data.body[0];
        const userDetail = org.userList && org.userList[0];
        if (!userDetail) {
            log(`用户详情为空`, 'error');
            return null;
        }

        log(`任务 ${taskCode} 获取到用户组织信息: ${userDetail.userName}`);
        return {
            ...userDetail,
            orgCode: org.orgCode,
            orgName: org.orgName,
            orgRoute: org.orgRoute
        };
    }

    async function submitInstallOrder(taskInfo, materialList, userDetail, coopcompanyCode, coopcompanyName, scanPersonName, scanPersonId, taskCode) {
        const url = 'https://cpms.it.chinamobile.com/cpms/mmat/v1/installorderHead/process/submit';

        const aSupplyDtos = materialList.map((item, idx) => {
            const newItem = {
                ...item,
                index: idx + 1,
                installAmount: item.canInstallAmount !== undefined ? item.canInstallAmount : 0,
                lossAmount: 0,
                remainAmount: 0,
                strArr: Array(20).fill(true)
            };
            if (item.canInstallAmount === 0) {
                newItem.installAmount = 0;
            }
            return newItem;
        });

        const participant = {
            id: userDetail.uid,
            name: userDetail.userName,
            typeCode: 'person',
            isOrg: false,
            leaf: true,
            level: 1,
            uniId: userDetail.uid + userDetail.orgCode,
            label: userDetail.userName,
            displayOrder: null,
            displayOrderInt: userDetail.displayOrderInt || '',
            userId: userDetail.userId,
            userType: userDetail.userType,
            uid: userDetail.uid,
            userName: userDetail.userName,
            employeeNum: userDetail.employeeNum || null,
            preferredMobile: userDetail.preferredMobile || '',
            orgRoute: userDetail.orgRoute,
            orgCode: userDetail.orgCode,
            orgName: userDetail.orgName,
            companyCode: userDetail.companyCode,
            companyName: userDetail.companyName,
            secondOrgCode: userDetail.secondOrgCode || null,
            secondOrgName: userDetail.secondOrgName || null,
            email: userDetail.email || '',
            duty: userDetail.duty || null,
            positionCode: userDetail.positionCode || null,
            levelName: userDetail.levelName || null,
            mainOrAssistant: userDetail.mainOrAssistant || null,
            createdDate: userDetail.createdDate,
            isCommonApprover: userDetail.isCommonApprover || null,
            componentParentOrgCode: userDetail.componentParentOrgCode || userDetail.orgCode,
            displayOrderNew: userDetail.displayOrderNew || userDetail.createdDate,
            employeeNumberNew: userDetail.employeeNumberNew || null
        };

        const submitBody = {
            installorderDto: {
                installorderHeadEntity: {
                    projectCode: taskInfo.projectCode,
                    projectName: taskInfo.projectName,
                    taskCode: taskInfo.taskCode,
                    taskName: taskInfo.taskName,
                    taskId: taskInfo.taskId,
                    coopcompanyCode: coopcompanyCode,
                    coopcompanyName: coopcompanyName,
                    install: 1,
                    installName: '安装单',
                    orderDesc: '',
                    scanPersonName: scanPersonName,
                    scanPersonId: scanPersonId,
                    projectCodes: [taskInfo.projectCode]
                },
                installResponseDto: {
                    aSupplyDtos: aSupplyDtos,
                    usedSupplyDtos: []
                },
                fileInfoBatchUpdateDto: {
                    ids: []
                }
            },
            edit: false,
            nextActivityParameter: {
                activityDefId: 'constructionControlUnitProjectLeader',
                relaDatas: {
                    hasSupervision: 1,
                    pathChoose: 'constructionControlUnitProjectLeader'
                },
                sceneId: 0,
                leftValue: 'action',
                rightValue: null,
                participants: [participant]
            },
            optionType: 1,
            participants: [participant]
        };

        const headers = getHeaders();
        headers['x-blueware-id'] = generateBluewareId();

        const resp = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(submitBody),
            credentials: 'include'
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.code !== '000000') {
            throw new Error(data.message);
        }
        log(`任务 ${taskCode} 提交接口返回成功`);
        return data;
    }

    // ---------- 并发执行主入口 ----------
    async function startProcess() {
        // 读取输入框值
        const projectCode = document.getElementById('cpms-input-projectCode')?.value.trim() || DEFAULT_CONFIG.projectCode;
        const taskCodesStr = document.getElementById('cpms-input-taskCodes')?.value.trim() || DEFAULT_CONFIG.taskCodes;
        const coopcompanyCode = document.getElementById('cpms-input-coopcompanyCode')?.value.trim() || DEFAULT_CONFIG.coopcompanyCode;
        const coopcompanyName = document.getElementById('cpms-input-coopcompanyName')?.value.trim() || DEFAULT_CONFIG.coopcompanyName;
        const scanPersonName = document.getElementById('cpms-input-scanPersonName')?.value.trim() || DEFAULT_CONFIG.scanPersonName;
        const scanPersonId = document.getElementById('cpms-input-scanPersonId')?.value.trim() || DEFAULT_CONFIG.scanPersonId;
        const concurrent = parseInt(document.getElementById('cpms-input-concurrent')?.value, 10) || DEFAULT_CONFIG.concurrent;

        // 解析任务编码
        const taskCodes = taskCodesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (taskCodes.length === 0) {
            log('❌ 未输入有效的任务编码', 'error');
            return;
        }

        // 重置统计
        resetStats();
        totalTasks = taskCodes.length;

        log(`=================================`);
        log(`开始批量处理，共 ${totalTasks} 个任务，并发数 ${concurrent}`);
        log(`项目编码: ${projectCode}`);
        log(`=================================`);

        const config = {
            projectCode,
            coopcompanyCode,
            coopcompanyName,
            scanPersonName,
            scanPersonId,
            roleCodes: DEFAULT_CONFIG.roleCodes
        };

        // 并发控制：分批执行
        for (let i = 0; i < taskCodes.length; i += concurrent) {
            const batch = taskCodes.slice(i, i + concurrent);
            log(`\n--- 开始第 ${Math.floor(i/concurrent)+1} 批，共 ${batch.length} 个任务 ---`);

            const promises = batch.map(taskCode => processSingleTask(taskCode, config));
            await Promise.allSettled(promises);

            log(`--- 第 ${Math.floor(i/concurrent)+1} 批处理完成 ---\n`);
        }

        // 输出汇总统计
        log(`=================================`);
        log(`📊 汇总统计：共计 ${totalTasks} 个任务`);
        log(`✅ 成功：${successCount}`);
        log(`❌ 失败：${failCount}`);
        log(`⏭️ 跳过：${skipCount}`);
        log(`=================================`);
        log(`🎉 所有任务处理完毕！`);
    }

    // 启动XHR拦截器
    installXHRInterceptor();
})();
