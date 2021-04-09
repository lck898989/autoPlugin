module.exports = {
    'listenNodePosition': async (event,params) => {
        console.log('event is ',event,' and params is ',params);
        const configPath = params.filePath;

        const fs = cc.require('fire-fs');
        console.log('fs is ',fs);
        
        let resStr;

        // fdas
        await new Promise((resolve) => {
            if(fs.existsSync(configPath)) {
                fs.readFile(configPath,'utf8',(err,data) => {
                    if(err) return;
                    if(!data) {
                        resStr = {};
                    } else {
                        resStr = JSON.parse(data);
                    }
                    resolve();
    
                });
            }
        })

        let selectNodeUuid = Editor.Selection.curSelection("node");
        let node = cc.engine.getInstanceById(selectNodeUuid);
        if(!node) {
            Editor.log("请先选择一个节点");
            return;
        };

        let obj = {x: 0,y: 0,scale: 1,active: true};
        const nodeName = node.name;
        const pos = node.getPosition();
        
        [obj.x,obj.y] = [pos.x,pos.y];
        obj.scale = node.scale;
        obj.active = node.active;

        const sprite = node.getComponent(cc.Sprite);

        if(sprite && sprite.spriteFrame) {
            Editor.log(sprite.spriteFrame.name);
            const uuid = sprite.spriteFrame.getTexture()._uuid;
            Editor.log(`texture's uuid is `,uuid);
            
            await new Promise((resolve) => {
                Editor.assetdb.queryInfoByUuid(uuid,(err,info) => {
                    if(err) {
                        console.log('err is ',err);
                    }
                    Editor.log('info is ',info);
                    obj['textureUrl'] = info.path;
    
                    resStr[nodeName] = obj;
    
                    resolve();
                })
            })

        } else if(!sprite || sprite && !sprite.spriteFrame){
            resStr[nodeName] = obj;
        }
        
        const resString = JSON.stringify(resStr,null,'\t');
        Editor.log('config str is ',resString);

        await new Promise((resolve) => {
            fs.writeFile(configPath, resString, (err) => {
                if (err) throw err;
                Editor.log('文件已被保存');
                
                Editor.assetdb.refresh('db://assets/config', function (err, results) {
                    if(err) return;
                    Editor.log('results is ',results);
                    resolve();
                });
            });
        })

        if (event.reply) {
            event.reply(null, 2);
        }
    },

    /**
     * 自动绑定脚本
     * @param  {event} event
     * @param  {Object} params
     */
    'bindScripts': async (event,params) => {
        Editor.log("***************😄开始自动绑定脚本😄***************");
        const uuid = params.uuid;
        const compName = params.compName;
        const prefabsUuid = params.prefabUuids;

        Editor.log('uuids is ',prefabsUuid);

        /**
         * 加载预制体信息并且返回预制体
         * @param  {string} uuid
         * @returns {cc.Prefab}
         */
        const loadPrefabByUuid = async (uuid) => {
            return new Promise((resolve,reject) => {
                cc.assetManager.loadAny({
                    type: 'uuid',
                    uuid
                },(err,res) => {
                    if(err) {
                        reject();
                        return;
                    }

                    resolve(res);
                })
            })
        }

        /**
         * 改变预制体的信息并且保存
         * @param  {string} url 预制体对应的路径
         * @param  {Object | any} prefabData 预制体的数据
         * @param  {Function} callback
         */
        const changePrefabAndSave = (url,prefabData,callback) => {
            if(callback) {
                Editor.assetdb.saveExists(url,prefabData,callback);
            } else {
                return new Promise((resolve,reject) => {
                    Editor.assetdb.saveExists(url,prefabData,(err,res) => {
                        if(err) {
                            reject(new Error('保存资源失败'));
                            return;
                        }
    
                        resolve(res);
    
                        callback && callback(res);
                    });
                });
            }

        }

        const prefabs = [];

        for(let uuidItem of prefabsUuid) {
            const prefab = await loadPrefabByUuid(uuidItem.uuid);
            prefab.data.addComponent(`${compName}SceneUI`);
            prefab.data.addComponent(`${compName}SceneLogic`);

            // 预制体序列化然后才能保存
            const dataItem = prefab.serialize();
            // 更新预制体
            await changePrefabAndSave(uuidItem.url,dataItem);
            prefabs.push(prefab);
        }

        cc.assetManager.loadAny({
            type: 'uuid',
            uuid
        },(err,res) => {
            if(err) {
                Editor.log('🙈加载RootNode失败，请确保RootNode存在🙈');
                return;
            }
            
            Editor.log("😄预制体资源是",res);

            // museumSceneManager
            const cname = `${compName}SceneManager`;
            Editor.log('组件名是：',cname);
            const indexCompName = `${compName}Index`;

            let indexComp = res.data.getComponent(indexCompName);
            let comp = res.data.getComponent(cname);

            if(!indexComp) {
                indexComp = res.data.addComponent(indexCompName);
            }
            if(!comp) {
                comp = res.data.addComponent(cname);
            }

            res.data.width = 1440;
            res.data.height = 924;

            if(!comp || !indexComp) {
                Editor.log('😒绑定index组件或者绑定场景管理器失败!');
                return;

            } else {
                comp.prefabs.length = 2;
                comp.prefabs.push(...prefabs);
            }

            const prefabData = res.serialize();

            changePrefabAndSave(`db://assets/${compName}/RootNode.prefab`,prefabData,async (err,result) => {
                if(err) {
                    Editor.log('🙈刷新RootNode失败');
                }
                // 查找Canvas节点然后在canvas节点下绑定main.js脚本
                const canvasNode = cc.find('Canvas');

                const canvasComp = canvasNode.getComponent(cc.Canvas);
                canvasComp.designResolution.width = 1440;
                canvasComp.designResolution.height = 924;
                
                Editor.log('canvasNode is ',canvasNode);
        
                if(canvasNode) {
                    // canvasNode.removeComponent(`${compName}Main`);
                    if(!canvasNode.getComponent(`${compName}Main`)) {
                        const mainComp = canvasNode.addComponent(`${compName}Main`);
                        mainComp.rootPrefab = await loadPrefabByUuid(uuid);
    
                        // 必须主进程去保存场景
                        Editor.Ipc.sendToMain('auto_generate_config:saveScene',err => {
                            if(err.code === 'ETIMEOUT') {
                                Editor.log("😒超时😒");
                            }
                            Editor.log("**********😄保存场景完成，绑定完毕，自动生成项目完毕😄,奥利给***********");
                        });
                    }
                    
                } else {
                    Editor.log("请切换到主场景界面");
                }
            });
        })
        
    },

    /**
     * 设置某个脚本文件为插件脚本并且将文件夹设置为bundle
     * @param  {event} event
     * @param  {Object} params
     */
    'setScriptToPlugin' (event,params) {
        Editor.log("params is ",params);
        const fileObj = params.item;
        const bundleObj = params.bundleObj;

        const jsUuid = fileObj.uuid;
        const folderUuid = bundleObj.uuid;
        const bundleName = params.compName;

        // 修改js文件为插件脚本
        Editor.assetdb.queryMetaInfoByUuid(jsUuid,(err,info) => {
            if(err) {
                Editor.log('err is ',err);
            }

            Editor.log('info is ',info);
            const metaJsonStr = info.json;
            const metaJson = JSON.parse(metaJsonStr);

            metaJson.isPlugin = true;
            metaJson.loadPluginInEditor = true;

            Editor.assetdb.saveMeta(metaJson.uuid,JSON.stringify(metaJson));
        });

        Editor.assetdb.queryMetaInfoByUuid(folderUuid,(err,info) => {
            if(err) {
                Editor.log('err is ',err);
            }

            Editor.log('info is ',info);
            const metaJsonStr = info.json;
            const metaJson = JSON.parse(metaJsonStr);

            metaJson.isBundle = true;
            metaJson.bundleName = bundleName;
            metaJson.priority = 8;
            /** 内联spriteframe */
            metaJson.inlineSpriteFrames = {
                "web-mobile": true
            }

            Editor.assetdb.saveMeta(metaJson.uuid,JSON.stringify(metaJson));
        });

    }
}