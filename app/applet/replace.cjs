const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'ConsultView.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// Find the target piece of code
const targetText = `{msg.detailedVersion && (msg.detailedVersion.optionComparison || msg.detailedVersion.generalExplanation || msg.detailedVersion.suggestedDiscussionPoints) && (
                                                    <div className="border-t border-dashed border-slate-200/80 pt-4 space-y-4">
                                                         <div className="flex items-center gap-2 px-1">
                                                             <span className="text-base">📋</span>
                                                             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">詳細說明與健康指引</h4>
                                                         </div>`;

const replacementText = `{msg.detailedVersion && (msg.detailedVersion.optionComparison || msg.detailedVersion.generalExplanation || msg.detailedVersion.suggestedDiscussionPoints) && (
                                                    <div className="border-t border-dashed border-slate-200/80 pt-4 space-y-4">
                                                         {/* 點擊展開/收合詳細說明的按鈕 */}
                                                         <button
                                                             onClick={() => {
                                                                 const msgId = msg.id || index.toString();
                                                                 setExpandedDetailedSections(prev => ({
                                                                     ...prev,
                                                                     [msgId]: !prev[msgId]
                                                                 }));
                                                             }}
                                                             className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-150 transition-all text-left cursor-pointer group"
                                                         >
                                                             <div className="flex items-center gap-3">
                                                                 <span className="text-xl">📋</span>
                                                                 <div className="space-y-0.5">
                                                                     <h4 className="text-[15px] font-black text-slate-800">詳細說明與健康指引</h4>
                                                                     <p className="text-[11px] text-slate-500 font-bold">包含方案利弊比對與就診提問建議</p>
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-2">
                                                                 <span className="text-xs font-black text-[#4A6E85] group-hover:underline">
                                                                     {expandedDetailedSections[msg.id || index.toString()] ? '點擊收合 ▲' : '點擊展開 ▼'}
                                                                 </span>
                                                             </div>
                                                         </button>

                                                         {expandedDetailedSections[msg.id || index.toString()] && (
                                                             <div className="space-y-4 animate-soft pt-1">`;

// We also need to add a closing tag before the outer </div> closing bracket of the detailedVersion block.
const originalBlockEnd = `                                                        )}
                                                    </div>
                                                )}`;

const replacementBlockEnd = `                                                        )}
                                                             </div>
                                                         )}
                                                     </div>
                                                 )}`;

if (content.includes(targetText)) {
    content = content.replace(targetText, replacementText);
    console.log('TargetText found and replaced successfully.');
} else {
    console.error('TargetText NOT found!');
}

if (content.includes(originalBlockEnd)) {
    content = content.replace(originalBlockEnd, replacementBlockEnd);
    console.log('Block end found and replaced successfully.');
} else {
    console.error('Block end NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
