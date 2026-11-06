# Paisajes del cielo: el cielo de la foto se vuelve transparente columna a columna (contorno real del paisaje),
# el resplandor queda semitransparente según su brillo y el color se «despremultiplica» sobre el cielo liso,
# para que encima del degradado se vea igual que la foto y por detrás asomen las estrellas hasta el borde.
import sys, glob, json, numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import minimum_filter1d, median_filter, gaussian_filter
D='C:/Users/marc-/Downloads/'; OUT='C:/Users/marc-/Desktop/Desktop_Claude/momenturies-formatos/_web/personaliza/'
SP=sys.argv[1]
SRC={
 'montana':'Firefly_Hazla más realista y más espectacular 490357.png',
 'cumbres':'Firefly_Gemini Flash_Hazla más realista y más espectacular 490357.png',
 'ciudad':'Firefly_Gemini Flash_Wide panoramic night city skyline*',
 'desierto':'*desert landscape*','pueblo':'*Mediterranean coastal*','lago':'*alpine lake*','campo':'*night countryside*',
 'amanecer':'*coastal landscape at the very first light*','alba':'*mountain landscape at the first light*',
 'tejados':'*rooftops of a generic*','rio':'*modern city by a calm river*','mar':'*classic white lighthouse*'}
def build(k, T=16):
    im=Image.open(glob.glob(D+SRC[k])[0]).convert('RGB'); W0,H0=im.size
    if k=='cumbres':   # fuera la luna de la foto
        cx,cy,r=int(.6925*W0),int(.413*H0),int(.016*W0); im.paste(im.crop((cx-4*r,cy-r,cx-2*r,cy+r)),(cx-r,cy-r))
    det=im if W0<=1600 else im.resize((1456,round(1456*H0/W0)),Image.LANCZOS)
    a=np.asarray(det.filter(ImageFilter.MedianFilter(7)),np.float32); hD,wD=a.shape[:2]
    B=np.median(a[int(.02*hD):int(.1*hD)].reshape(-1,3),0)
    LUM=lambda c:c[...,0]*.299+c[...,1]*.587+c[...,2]*.114; lB=LUM(B)
    y0=int((.38 if k=='cumbres' else .04)*hD); ema=a[y0].copy(); hor=np.full(wD,hD-1); done=np.zeros(wD,bool)
    for y in range(y0,hD):
        d=np.linalg.norm(a[y]-ema,axis=1); dB=np.linalg.norm(a[y]-B,axis=1)
        hit=((d>T)|((dB>22)&(LUM(a[y])<=lB+6)))&~done; hor[hit]=y; done|=hit
        ema=np.where(done[:,None],ema,.5*ema+.5*a[y])
    med=median_filter(hor,size=31,mode='nearest'); hor=np.minimum(hor,med+.02*hD)   # columnas sin detectar: el contorno de sus vecinas
    if k=='mar':   # el agua iluminada se confunde con el cielo: horizonte del mar fijado a mano
        xs=np.arange(wD)>.4*wD; hor[xs]=np.minimum(hor[xs],int(.735*hD))
    hor=minimum_filter1d(hor,5)
    Wo=3600; Ho=round(Wo*H0/W0)
    big=im.resize((Wo,Ho),Image.LANCZOS)
    if W0<3000: big=big.filter(ImageFilter.UnsharpMask(2,50,2))
    o=np.asarray(big,np.float32)
    h=np.interp(np.linspace(0,wD-1,Wo),np.arange(wD),hor.astype(np.float32))*(Ho/hD)
    f=max(4,.006*Ho); Y=np.arange(Ho,dtype=np.float32)[:,None]
    L=np.clip((Y-(h[None,:]-f))/f,0,1); L=L*L*(3-2*L)
    sm=gaussian_filter(np.asarray(det.filter(ImageFilter.MedianFilter(7)).resize((Wo,Ho),Image.BILINEAR),np.float32),(3,3,0))
    lum=lambda c:c[...,0]*.299+c[...,1]*.587+c[...,2]*.114
    att=np.clip((lum(sm)-lum(B)-5)/70,0,1)
    if k=='cumbres': att[:int(.40*Ho)]=0   # su propia Vía Láctea fuera: la pinta el cielo de la fecha
    al=np.maximum(L,att)
    rgb=np.where(al[...,None]>.01,(o-(1-al[...,None])*B)/np.maximum(al[...,None],.01),B)
    out=np.dstack([np.clip(rgb,0,255),al*255]).astype(np.uint8)
    Image.fromarray(out,'RGBA').save(OUT+'paisaje-%s.webp'%k,quality=86,alpha_quality=90,method=6)
    # control: máscara en blanco sobre gris
    Image.fromarray((al*255).astype(np.uint8)).resize((600,round(600*Ho/Wo))).save(SP+'/mask_%s.png'%k)
    return '#%02x%02x%02x'%tuple(int(round(c)) for c in B), round(float(h.min()/Ho),3)
res={k:build(k) for k in (sys.argv[2:] or SRC)}
print(json.dumps(res))
