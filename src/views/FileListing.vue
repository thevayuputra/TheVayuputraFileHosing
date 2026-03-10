<template>
<section class="file-listing">

<header class="page-header">
<h1>Simple File Hosting</h1>
<p class="page-subtitle">
Browse folders, copy links, and download files from one place.
</p>
</header>

<transition name="fade">
<div v-if="status" class="status-toast">{{ status }}</div>
</transition>

<div v-if="error" class="error">{{ error }}</div>

<div v-else class="tree-shell">

<ul v-if="tree.length" class="tree-root">
<TreeNode
v-for="node in tree"
:key="node.path"
:node="node"
:level="0"
@copy-url="copyFileUrl"
@download="downloadFile"
/>
</ul>

<p v-else>No files found</p>

</div>
</section>
</template>

<script lang="ts">
import { defineComponent,h,onMounted,PropType,ref } from 'vue'

type TreeItem={
name:string
path:string
isDirectory:boolean
children:TreeItem[]
}

const toPublicUrl=(filePath:string)=>{
const normalized=filePath.replace(/^\/+/,'').replace(/^#\/+/,'')
const base=import.meta.env.BASE_URL || '/'
return new URL(`${base}${normalized}`,window.location.origin).toString()
}

const TreeNode=defineComponent({

name:'TreeNode',

props:{
node:{type:Object as PropType<TreeItem>,required:true},
level:{type:Number,required:true}
},

emits:['copy-url','download'],

setup(props,{emit}){

const expanded=ref(props.level===0)

const toggle=()=>{
if(props.node.isDirectory)
expanded.value=!expanded.value
}

const handleCopy=()=>emit('copy-url',props.node.path)
const handleDownload=()=>emit('download',props.node.path)

return()=>{

/* folder */

if(props.node.isDirectory){

return h('li',{class:'tree-node'},[

h('div',{
class:'tree-row',
style:{paddingLeft:`${props.level*20}px`}
},[

h('i',{class:'fa fa-folder folder-icon'}),

h('span',{
class:'folder-arrow',
onClick:toggle
},[
h('i',{
class:`fa ${expanded.value?'fa-chevron-down':'fa-chevron-right'}`
})
]),

h('span',{
class:'folder-name',
onClick:toggle
},props.node.name)

]),

expanded.value && props.node.children.length
? h('ul',{class:'tree-children'},
props.node.children.map(child=>
h(TreeNode,{
key:child.path,
node:child,
level:props.level+1,
onCopyUrl:(p:string)=>emit('copy-url',p),
onDownload:(p:string)=>emit('download',p)
})
)
)
:null

])

}

/* file */

return h('li',{class:'tree-node'},[

h('div',{
class:'tree-row',
style:{paddingLeft:`${props.level*20}px`}
},[

h('i',{class:'fa fa-file file-icon'}),

h('button',{
class:'action-btn',
onClick:handleCopy
},'Copy'),

h('button',{
class:'action-btn primary',
onClick:handleDownload
},'Download'),

h('span',{class:'file-name'},props.node.name)

])

])

}

}

})

export default defineComponent({

name:'FileListing',
components:{TreeNode},

setup(){

const tree=ref<TreeItem[]>([])
const error=ref('')
const status=ref('')
const rootFolderName=ref('FileRoot')

function buildTree(items:{path:string,isDirectory:boolean}[]){

const root:TreeItem[]=[]

items.forEach(item=>{

const normalized=item.path.replace(/\\+/g,'/')
const parts=normalized.split('/').filter(Boolean)

let currentLevel=root
let currentPath=''

parts.forEach((part,index)=>{

currentPath=currentPath?`${currentPath}/${part}`:part

let node=currentLevel.find(e=>e.path===currentPath)

if(!node){

node={
name:part,
path:currentPath,
isDirectory:index<parts.length-1 || item.isDirectory,
children:[]
}

currentLevel.push(node)

}

if(index===parts.length-1)
node.isDirectory=item.isDirectory

currentLevel=node.children

})

})

/* SORT FOLDER FIRST */

const sortNodes=(nodes:TreeItem[])=>{

nodes.sort((a,b)=>{

if(a.isDirectory!==b.isDirectory)
return a.isDirectory?-1:1

return a.name.localeCompare(b.name)

})

nodes.forEach(n=>sortNodes(n.children))

}

sortNodes(root)

return root

}

const copyFileUrl=async(filePath:string)=>{

const url=toPublicUrl(filePath)

await navigator.clipboard.writeText(url)

status.value='Copied!'
setTimeout(()=>status.value='',2000)

}

const downloadFile=(filePath:string)=>{

const link=document.createElement('a')

link.href=toPublicUrl(filePath)

link.download=filePath.split('/').pop()||'download'

document.body.appendChild(link)
link.click()
document.body.removeChild(link)

}

async function load(){

const res=await fetch(`${import.meta.env.BASE_URL}tree.json`)

const data=await res.json()

rootFolderName.value=data.rootFolder||'FileRoot'

tree.value=[{
name:rootFolderName.value,
path:'',
isDirectory:true,
children:buildTree(data.tree)
}]

}

onMounted(load)

return{tree,error,status,copyFileUrl,downloadFile}

}

})
</script>

<style scoped>

.file-listing{
max-width:900px;
margin:auto;
padding:40px 20px;
font-family:system-ui;
}

.tree-shell{
background:#f9fbff;
border:1px solid #ddd;
padding:20px;
border-radius:12px;
}

.tree-root,
.tree-children{
list-style:none;
padding:0;
margin:0;
}

.tree-node{
margin:6px 0;
}

.tree-row{
display:flex;
align-items:center;
gap:10px;
padding:6px 8px;
border-radius:6px;
}

.tree-row:hover{
background:#eef2ff;
}

.folder-icon{
color:#f59e0b;
}

.file-icon{
color:#3b82f6;
}

.folder-arrow{
cursor:pointer;
width:16px;
}

.folder-name{
cursor:pointer;
font-weight:600;
}

.file-name{
margin-left:12px;
flex:1;
}

.action-btn{
border:none;
background:#e0e7ff;
padding:3px 8px;
border-radius:4px;
cursor:pointer;
font-size:12px;
}

.action-btn.primary{
background:#3b82f6;
color:white;
}

.tree-children{
padding-left:20px;
border-left:1px dashed #ccc;
margin-top:4px;
}

.status-toast{
position:fixed;
top:20px;
right:20px;
background:#2563eb;
color:white;
padding:6px 12px;
border-radius:6px;
}

.fade-enter-active,
.fade-leave-active{
transition:opacity .3s;
}

.fade-enter-from,
.fade-leave-to{
opacity:0;
}

</style>