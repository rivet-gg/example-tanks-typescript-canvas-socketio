import tileSandUrl from "url:./assets/tileSand1.png";
import tankBodyUrl from "url:./assets/tankBody_sand_outline.png";
import tankBarrelUrl from "url:./assets/tankSand_barrel1_outline.png";
import bulletUrl from "url:./assets/shotRed.png";

export class Assets {
    public scaleFactor = 1;

    public tileSand = this._load(tileSandUrl);
    public tankBody = this._load(tankBodyUrl);
    public tankBarrel = this._load(tankBarrelUrl);
    public bullet = this._load(bulletUrl);

    private _load(url: string): HTMLImageElement {
        let img = new Image();
        img.src = url;
        return img;
    }
}
