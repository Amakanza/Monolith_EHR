"use strict";(()=>{var e={};e.id=9586,e.ids=[9586],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},28355:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>_,patchFetch:()=>v,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var a={};i.r(a),i.d(a,{GET:()=>c});var n=i(49303),s=i(88716),o=i(60670),r=i(91806),d=i(87070);async function c(e,{params:t}){try{let{id:e}=await t,{invoice:i,items:a}=await (0,r.m5)(e),n=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${i.invoiceNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .meta { text-align: right; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .table th, .table td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
          .totals { width: 300px; margin-left: auto; }
          .row { display: flex; justify-content: space-between; padding: 5px 0; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p><strong>Bill To:</strong><br/>${i.patientName}</p>
          </div>
          <div class="meta">
            <p><strong>Invoice #:</strong> ${i.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(i.issueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${i.status.toUpperCase()}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${a.map(e=>`
              <tr>
                <td>${e.description}</td>
                <td style="text-align:right">${e.quantity}</td>
                <td style="text-align:right">${(e.unitPriceCents/100).toFixed(2)}</td>
                <td style="text-align:right">${(e.lineSubtotalCents/100).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal:</span> <span>${(i.subtotalCents/100).toFixed(2)}</span></div>
          <div class="row"><span>Tax (${i.taxRate}%):</span> <span>${(i.taxCents/100).toFixed(2)}</span></div>
          <div class="row bold"><span>Total:</span> <span>${i.currency} ${(i.totalCents/100).toFixed(2)}</span></div>
          <div class="row"><span>Paid:</span> <span>${(i.amountPaidCents/100).toFixed(2)}</span></div>
          <div class="row bold"><span>Balance Due:</span> <span>${(i.balanceDueCents/100).toFixed(2)}</span></div>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;return new d.NextResponse(n,{headers:{"Content-Type":"text/html"}})}catch(e){return d.NextResponse.json({error:e.message},{status:404})}}let l=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/invoices/[id]/print/route",pathname:"/api/invoices/[id]/print",filename:"route",bundlePath:"app/api/invoices/[id]/print/route"},resolvedPagePath:"C:\\Users\\andil\\Desktop\\Monolith_EHR-main\\app\\api\\invoices\\[id]\\print\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:u,staticGenerationAsyncStorage:p,serverHooks:m}=l,_="/api/invoices/[id]/print/route";function v(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}},91806:(e,t,i)=>{i.d(t,{Ji:()=>b,LV:()=>y,ME:()=>m,SA:()=>v,T8:()=>f,aL:()=>p,m5:()=>u,p:()=>_});var a=i(19692),n=i(97108),s=i(79527),o=i(16311);function r(e){return{id:e.id,clinicId:e.clinic_id,patientId:e.patient_id,appointmentId:e.appointment_id,noteId:e.note_id,invoiceNumber:e.invoice_number,issueDate:e.issued_date,dueDate:e.due_date,status:e.status,currency:e.currency,taxRate:Number(e.tax_rate),subtotalCents:Number(e.subtotal_cents),taxCents:Number(e.tax_cents),totalCents:Number(e.total_cents),amountPaidCents:Number(e.amount_paid_cents),balanceDueCents:Number(e.balance_due_cents),balanceCents:Number(e.balance_due_cents),internalNote:e.internal_note,publicNote:e.public_note,claimStatus:e.claim_status,claimReference:e.claim_reference,mainMemberNameSnapshot:e.main_member_name_snapshot,medicalAidNameSnapshot:e.medical_aid_name_snapshot,medicalAidPlanSnapshot:e.medical_aid_plan_snapshot,medicalAidNumberSnapshot:e.medical_aid_number_snapshot,dependentCodeSnapshot:e.dependent_code_snapshot,createdBy:e.created_by,createdAt:e.created_at,updatedAt:e.updated_at,patientName:e.patients?`${e.patients.first_name} ${e.patients.last_name}`:void 0,creatorName:e.user_profiles&&(0,s.gl)(e.user_profiles).fullName||void 0}}function d(e){return{id:e.id,clinicId:e.clinic_id,invoiceId:e.invoice_id,description:e.description,quantity:Number(e.quantity),unitPriceCents:Number(e.unit_price_cents),lineSubtotalCents:Number(e.line_subtotal_cents),createdAt:e.created_at}}function c(e){return{id:e.id,clinicId:e.clinic_id,invoiceId:e.invoice_id,patientId:e.patient_id,paymentDate:e.payment_date,method:e.method,amountCents:Number(e.amount_cents),reference:e.reference,receivedBy:e.received_by,createdAt:e.created_at,receiverName:e.user_profiles&&(0,s.gl)(e.user_profiles).fullName||void 0}}async function l(e){let t=await (0,a.e)(),{data:i}=await t.from("invoice_items").select("line_subtotal_cents").eq("invoice_id",e),n=i?.reduce((e,t)=>e+Number(t.line_subtotal_cents),0)||0,{data:s}=await t.from("payments").select("amount_cents").eq("invoice_id",e),o=s?.reduce((e,t)=>e+Number(t.amount_cents),0)||0,{data:r}=await t.from("invoices").select("tax_rate, status").eq("id",e).single();if(!r)return;let d=Math.round(Number(r.tax_rate)/100*n),c=n+d,l=Math.max(c-o,0),u=r.status;"void"!==u&&0===l&&c>0?u="paid":"paid"===u&&l>0&&(u="sent"),await t.from("invoices").update({subtotal_cents:n,tax_cents:d,total_cents:c,amount_paid_cents:o,balance_due_cents:l,status:u}).eq("id",e)}async function u(e){let t=await (0,a.e)(),{data:i,error:n}=await t.from("invoices").select("*, patients(first_name, last_name), user_profiles(full_name)").eq("id",e).single();if(n||!i)throw Error("Invoice not found");let{data:s}=await t.from("invoice_items").select("*").eq("invoice_id",e).order("created_at",{ascending:!0}),{data:o}=await t.from("payments").select("*, user_profiles(full_name)").eq("invoice_id",e).order("payment_date",{ascending:!1});return{invoice:r(i),items:(s||[]).map(d),payments:(o||[]).map(c)}}async function p(e,t){let i=await (0,a.e)(),{data:n}=await i.from("invoices").select("status").eq("id",e).single();if(n?.status==="void")throw Error("Cannot edit void invoice");let s={};void 0!==t.dueDate&&(s.due_date=t.dueDate),void 0!==t.taxRate&&(s.tax_rate=t.taxRate),void 0!==t.internalNote&&(s.internal_note=t.internalNote),void 0!==t.publicNote&&(s.public_note=t.publicNote),void 0!==t.claimStatus&&(s.claim_status=t.claimStatus),void 0!==t.claimReference&&(s.claim_reference=t.claimReference);let{data:o,error:d}=await i.from("invoices").update(s).eq("id",e).select("*, patients(first_name, last_name), user_profiles(full_name)").single();if(d)throw Error(d.message);if(void 0!==t.taxRate){await l(e);let{data:t}=await i.from("invoices").select("*, patients(first_name, last_name), user_profiles(full_name)").eq("id",e).single();return{invoice:r(t)}}return{invoice:r(o)}}async function m(e){let t=await (0,a.e)(),{data:i}=await t.from("invoices").select("status, clinic_id").eq("id",e).single();if(!i)throw Error("Not found");"draft"===i.status&&(await t.from("invoices").update({status:"sent"}).eq("id",e),await (0,o.is)({clinicId:i.clinic_id,eventType:"invoice.sent",entityType:"invoice",entityId:e}))}async function _(e){let t=await (0,a.e)(),{data:i}=await t.from("invoices").select("clinic_id").eq("id",e).single();await t.from("invoices").update({status:"void",balance_due_cents:0}).eq("id",e),i&&await (0,o.is)({clinicId:i.clinic_id,eventType:"invoice.voided",entityType:"invoice",entityId:e})}async function v(e,t){await (0,n.sm)();let i=await (0,a.e)(),{data:s}=await i.from("invoices").select("clinic_id, status").eq("id",e).single();if(!s)throw Error("Invoice not found");if("paid"===s.status||"void"===s.status)throw Error("Cannot add items to paid/void invoice");let o=Math.round(t.quantity*t.unitPriceCents),{data:r,error:c}=await i.from("invoice_items").insert({clinic_id:s.clinic_id,invoice_id:e,description:t.description,quantity:t.quantity,unit_price_cents:t.unitPriceCents,line_subtotal_cents:o}).select().single();if(c)throw Error(c.message);return await l(e),{item:d(r)}}async function f(e,t){let i=await (0,a.e)(),{data:n}=await i.from("invoice_items").select("invoice_id").eq("id",e).single();if(!n)throw Error("Item not found");let s={};if(t.description&&(s.description=t.description),void 0!==t.quantity||void 0!==t.unitPriceCents){let{data:a}=await i.from("invoice_items").select("quantity, unit_price_cents").eq("id",e).single();if(!a)throw Error("Invoice item not found");let n=t.quantity??a.quantity,o=t.unitPriceCents??a.unit_price_cents;s.quantity=n,s.unit_price_cents=o,s.line_subtotal_cents=Math.round(n*o)}let{data:o,error:r}=await i.from("invoice_items").update(s).eq("id",e).select().single();if(r)throw Error(r.message);return await l(n.invoice_id),{item:d(o)}}async function y(e){let t=await (0,a.e)(),{data:i}=await t.from("invoice_items").select("invoice_id").eq("id",e).single();i&&(await t.from("invoice_items").delete().eq("id",e),await l(i.invoice_id))}async function b(e,t){let i=await (0,n.sm)(),s=await (0,a.e)(),{data:r}=await s.from("invoices").select("clinic_id, patient_id, status").eq("id",e).single();if(!r)throw Error("Invoice not found");if("void"===r.status)throw Error("Cannot pay void invoice");let{data:d,error:u}=await s.from("payments").insert({clinic_id:r.clinic_id,invoice_id:e,patient_id:r.patient_id,payment_date:t.paymentDate,method:t.method,amount_cents:t.amountCents,reference:t.reference,received_by:i.id}).select("*, user_profiles(full_name)").single();if(u)throw Error(u.message);return await l(e),await (0,o.is)({clinicId:r.clinic_id,eventType:"payment.received",entityType:"payment",entityId:d.id,metadata:{invoiceId:e,amount:t.amountCents}}),{payment:c(d)}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),a=t.X(0,[9276,3786,9706,5972,6311],()=>i(28355));module.exports=a})();