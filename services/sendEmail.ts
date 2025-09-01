import { supabase } from "@/lib/supabase";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;     // your function expects { to, subject, html }
};
export const invokeSendEmail=async(input: SendEmailInput)=>{
   const { data: { session } } = await supabase.auth.getSession();
   const { data, error } = await supabase.functions.invoke('send-email', {
    method: 'POST',
    body: input,
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if(data?.id ){}
  return data;
}