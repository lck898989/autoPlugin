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
        const uuid = params.uuid;
        const compName = params.compName;
        const prefabsUuid = params.prefabUuids;

        Editor.log('uuids is ',prefabsUuid);

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

        const prefabs = [];

        for(let uuidItem of prefabsUuid) {
            const prefab = await loadPrefabByUuid(uuidItem);
            prefabs.push(prefab);
        }

        cc.assetManager.loadAny({
            type: 'uuid',
            uuid
        },(err,res) => {
            if(err) {
                Editor.log('err is ',err);
                return;
            }
            
            Editor.log("预制体资源是",res);

            // museumSceneManager
            const cname = `${compName}SceneManager`;
            Editor.log('组件名是：',cname);

            const comp = res.data.addComponent(cname);
            if(!comp) {
                Editor.log('managerScript is null');
                return;

            } else {
                comp.prefabs.length = 2;
                comp.prefabs.push(...prefabs);
            }

            const prefabData = res.serialize();

            Editor.assetdb.saveExists(`db://assets/${compName}/RootNode.prefab`,prefabData,async (err,result) => {
                if(err) {
                    Editor.log('err is ',err);
                }
                Editor.log('result is ',result);

                // 查找Canvas节点然后在canvas节点下绑定main.js脚本
                const canvasNode = cc.find('Canvas');
                Editor.log("canvasNode is ",canvasNode);
                
                if(canvasNode) {
                    const mainComp = canvasNode.addComponent(`${compName}Main`);
                    mainComp.rootPrefab = await loadPrefabByUuid(uuid);
                    
                } else {
                    Editor.log("请切换到主场景界面");
                }
            })
        })
        
    },

    /**
     * 设置某个脚本文件为插件脚本
     * @param  {event} event
     * @param  {Object} params
     */
    'setScriptToPlugin' (event,params) {

        const jsUuid = params.uuid;
        Editor.log("jsUuid is ",jsUuid);
        console.log('remote is ',Editor.assetdb.remote.loadMetaByUuid);

        const meatFile = Editor.assetdb.remote.loadMetaByUuid(jsUuid);
        Editor.log("jsfile’s meat file is ",meatFile);
        meatFile.isPlugin = true;
        meatFile.loadPluginInEditor = true;

        
    }
}