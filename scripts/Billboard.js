Events.on(EventType.ClientLoadEvent, cons(e => {

    Vars.ui.settings = new SettingsMenuDialog();

    var dialog = new JavaAdapter(BaseDialog, {}, " Brilliance - 光辉 \n \n \n [magenta]作者 [yellow]：[cyan]末狐是个鸽    [yellow]寄术指导（ ： [maroon]Lyl，[blue]Z-F，[white]年年有鱼，[red]炽热，[yellow]RA-2...一大堆大佬");
    dialog.shown(run(() => {
        dialog.cont.table(Tex.button, cons(t => {
            t.defaults().size(280, 60).left();
            t.button("OK", Icon.trash, Styles.cleart, run(() => {
                dialog.hide();
            }));
            t.add("Brilliance - 光辉 V.0.9.6 : \n Please unlock the mod technology before entering the map! \n Please!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }));
    }));

    dialog.show();
}))