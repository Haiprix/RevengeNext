@file:JvmName("KmmiioLibPlugin")

package Loki.vtx.lib

import io.github.revenge.plugins.plugin

val kmmiioLibPlugin = plugin {
    start {
        Loki.vtx.lib.chatbubbles.BubbleBridge.register(this, classLoader)
        Loki.vtx.lib.declutter.DeclutterBridge.register(this, classLoader)
        Loki.vtx.lib.mediasession.MediaSessionHooks.install(classLoader)
        Loki.vtx.lib.mediasession.MediaSessionBridge.register(this)
    }
    stop {
        Loki.vtx.lib.chatbubbles.MessageViewHooks.uninstall()
        Loki.vtx.lib.chatbubbles.BubbleConfig.hooksEnabled = false
        Loki.vtx.lib.declutter.DeclutterHooks.uninstall()
    }
}
