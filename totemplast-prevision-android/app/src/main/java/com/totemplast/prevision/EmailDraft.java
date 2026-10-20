package com.totemplast.prevision;

import java.nio.charset.StandardCharsets;

/**
 * Borrador de correo para clientes que leen el asunto y el cuerpo desde mailto:
 * (RFC 6068). No envía el mensaje; lo abre en la aplicación de correo.
 */
public final class EmailDraft {
 public static final String RECIPIENT="daniel@totemplast.com";
 private static final char[] HEX="0123456789ABCDEF".toCharArray();

 private EmailDraft() {}

 /**
  * Codifica UTF-8 como porcentajes. Usa %20 para los espacios y %0A para
  * los saltos de línea: ni '&', ni '?', ni los acentos pueden cortar el cuerpo.
  */
 public static String encodeQuery(String input) {
  if (input == null) throw new IllegalArgumentException("Texto de correo inexistente");
  byte[] bytes = input.getBytes(StandardCharsets.UTF_8);
  StringBuilder result=new StringBuilder(bytes.length * 2);
  for (byte item:bytes) {
   int c=item & 0xff;
   if ((c>='A' && c<='Z') || (c>='a' && c<='z')
       || (c>='0' && c<='9') || c=='-' || c=='.' || c=='_' || c=='~') {
    result.append((char)c);
   } else {
    result.append('%').append(HEX[c >>> 4]).append(HEX[c & 0x0f]);
   }
  }
  return result.toString();
 }

 public static String mailtoUri(String subject,String body) {
  if (subject == null || subject.trim().isEmpty())
   throw new IllegalArgumentException("El correo necesita asunto");
  if (body == null || body.trim().isEmpty())
   throw new IllegalArgumentException("El correo necesita el informe completo");
  return "mailto:"+RECIPIENT+"?subject="+encodeQuery(subject)+"&body="+encodeQuery(body);
 }
}
